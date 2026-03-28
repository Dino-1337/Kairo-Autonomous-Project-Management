import json
import os
import sys
from agents.llm_client import OpenRouterClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TaskDecompositionAgent:
    def __init__(self):
        self.llm_client = OpenRouterClient()
        self.company_profile = self.load_company_profile()
        print(" Task Decomposition Agent initialized")

    def load_company_profile(self):
        try:
            profile_path = os.path.join(os.path.dirname(__file__), "..", "config", "company_profile.json")
            with open(profile_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f" Failed to load company profile: {e}")
            return self.get_default_profile()

    def get_default_profile(self):
        return {
            "company_name": "Tech Startup",
            "tech_stack": ["React", "Node.js", "Python", "MongoDB"],
            "team_structure": "Small full-stack team",
            "task_constraints": {"max_tasks": 6, "max_hours_per_task": 8},
        }

    def get_clean_prompt(self, user_request: str, context: dict = None) -> str:
        constraints = self.company_profile["task_constraints"]
        context = context or {}

        urgency_note = "URGENT PRIORITY" if context.get("urgency") else "Normal priority"
        deadline_note = f"Deadline: {context.get('deadline')}" if context.get("deadline") != "None" else "No hard deadline"

        max_tasks = constraints["max_tasks"]
        max_h = constraints["max_hours_per_task"]

        return f"""
You are a senior project manager. Decompose ONLY when the REQUEST is a concrete, actionable work item
(build something, fix a bug, ship a feature, change copy, etc.).

REQUEST: "{user_request}"
STATUS: {urgency_note}, {deadline_note}

CONTEXT:
- Team: {self.company_profile['team_structure']}
- Tech: {", ".join(self.company_profile['tech_stack'][:5])}

RULES (critical):
- If the request is NOT actionable work (greetings, noise, empty intent), return exactly:
  {{"tasks": [], "task_count_rationale": "Not a work request.", "suggested_parallel_capacity": 0}}
- Otherwise return the minimum number of REAL tasks needed — often ONE for a small fix, two–three when design then build, etc.
  Do NOT pad to fill a quota. {max_tasks} is a HARD CEILING, not a target.
- Prefer ONE end-to-end task when a single person can own it. Split only when different skills or true parallel tracks are required.
- Use depends_on only for real sequencing. Each task: 1–{max_h} estimated_hours.
- suggested_parallel_capacity: integer 1..{max_tasks} meaning how many people could usefully work in parallel on this breakdown.

Return ONLY a single JSON object (no markdown) with this shape:
{{
  "tasks": [
    {{
      "id": 1,
      "title": "...",
      "description": "...",
      "estimated_hours": 4,
      "skills_required": ["backend"],
      "depends_on": []
    }}
  ],
  "task_count_rationale": "one short sentence why this many tasks",
  "suggested_parallel_capacity": 1
}}

Task fields: id (integer, unique), title, description, estimated_hours, skills_required (array), depends_on (array of ids).
Skills: design, frontend, backend, copywriting, qa, devops, ai
"""

    def get_meeting_prompt(self, meeting_text: str, context: dict = None) -> str:
        """Prompt optimised for extracting explicit action items from meeting notes."""
        constraints = self.company_profile["task_constraints"]
        max_tasks = constraints["max_tasks"]
        max_h = constraints["max_hours_per_task"]

        team_members = []
        try:
            members_path = os.path.join(os.path.dirname(__file__), "..", "config", "team_config.json")
            with open(members_path) as f:
                team_members = json.load(f)
        except Exception:
            pass

        roster_lines = "\n".join(
            f"  - {m['name']} ({m.get('role', '')}) — skills: {', '.join(m.get('skills', []))}"
            for m in team_members
        ) or "  (no team roster loaded)"

        return f"""
You are a project manager reading a MEETING NOTE.
Extract ONLY the explicit action items / tasks that were agreed in this meeting.

MEETING NOTE:
\"\"\"
{meeting_text}
\"\"\"

REAL TEAM ROSTER (use these names in suggested_assignee_name):
{roster_lines}

RULES:
1. Extract ONLY tasks explicitly stated as action items, to-dos, or next steps.
   Do NOT invent tasks not mentioned. Do NOT add generic PM tasks.
2. For suggested_assignee_name: pick the BEST-MATCHING real team member by role/skills.
   (e.g. "AI/ML intern" or "prompt engineering" → backend+ai member;
         "Frontend intern" or "UX/loading animations" → frontend/design member;
         "Team Lead" or "validation rules" → backend specialist;
         "Project Manager" or "scalability planning" → PM member.)
   If truly no match, use null.
3. Convert deadline hints to estimated_hours:
   "1 day"=8h, "2 days"=16h, "3 days"=24h, "next sprint"=40h. Cap at {max_h}h.
4. Maximum {max_tasks} tasks total. Merge very similar items if needed.
5. suggested_parallel_capacity = count of tasks that can run simultaneously.

Return ONLY a JSON object (no markdown):
{{
  "tasks": [
    {{
      "id": 1,
      "title": "Improve prompt engineering for SQL edge cases",
      "description": "Refine LLM prompts to handle ambiguous/edge-case queries correctly.",
      "estimated_hours": 16,
      "skills_required": ["backend", "ai"],
      "depends_on": [],
      "suggested_assignee_name": "Pravakar"
    }}
  ],
  "task_count_rationale": "4 explicit action items found in meeting notes",
  "suggested_parallel_capacity": 3
}}

Task fields: id (int, unique), title, description, estimated_hours, skills_required
(array of: design/frontend/backend/copywriting/qa/devops/ai), depends_on (array of ids),
suggested_assignee_name (string matching roster name, or null).
"""

    def decompose_request(self, user_request: str, context: dict = None) -> dict:
        print(f" Decomposing: '{user_request[:80]}...' (source={context.get('source', 'manual') if context else 'manual'})")

        source = (context or {}).get("source", "manual")
        if source == "meeting":
            prompt = self.get_meeting_prompt(user_request, context)
        else:
            prompt = self.get_clean_prompt(user_request, context)

        messages = [
            {"role": "system", "content": "You output only one valid JSON object. No markdown, no explanations."},
            {"role": "user", "content": prompt},
        ]

        response = self.llm_client.chat_completion(messages, temperature=0.1)

        if not response:
            return self._empty_result("LLM returned no response.")

        return self.parse_response(response, user_request)

    def parse_response(self, response: str, user_request: str) -> dict:
        try:
            obj = self._extract_json_object(response)
            if obj is None:
                return self._empty_result("Could not parse model output.")

            tasks = obj.get("tasks")
            if tasks is None:
                # Legacy: bare array
                arr = self._extract_json_array(response)
                if arr is not None:
                    tasks = arr
                    obj = {"tasks": tasks, "task_count_rationale": "", "suggested_parallel_capacity": 1}
                else:
                    return self._empty_result("Missing tasks array.")

            if not isinstance(tasks, list):
                return self._empty_result("tasks must be a JSON array.")

            tasks = self.apply_constraints(tasks)
            rationale = obj.get("task_count_rationale") or ""
            cap = obj.get("suggested_parallel_capacity")
            try:
                cap = int(cap) if cap is not None else max(1, min(len(tasks), 1) if tasks else 0)
            except (TypeError, ValueError):
                cap = 1 if tasks else 0

            print(f" Generated {len(tasks)} tasks")
            return {
                "status": "success",
                "tasks": tasks,
                "total_tasks": len(tasks),
                "task_count_rationale": rationale,
                "suggested_parallel_capacity": cap,
            }
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f" JSON parse error: {e}")
            return self._empty_result("Invalid JSON from model.")

    def _extract_json_object(self, response: str) -> dict | None:
        start = response.find("{")
        if start == -1:
            return None
        depth = 0
        for i in range(start, len(response)):
            c = response[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(response[start : i + 1])
                    except json.JSONDecodeError:
                        return None
        return None

    def _extract_json_array(self, response: str) -> list | None:
        json_start = response.find("[")
        json_end = response.rfind("]") + 1
        if json_start == -1 or json_end == 0:
            return None
        try:
            return json.loads(response[json_start:json_end])
        except json.JSONDecodeError:
            return None

    def apply_constraints(self, tasks):
        constraints = self.company_profile["task_constraints"]
        constrained_tasks = []

        for task in tasks[: constraints["max_tasks"]]:
            if task.get("estimated_hours", 0) > constraints["max_hours_per_task"]:
                task["estimated_hours"] = constraints["max_hours_per_task"]
            task.setdefault("depends_on", [])
            task.setdefault("skills_required", [])
            # Preserve meeting-note hints for the assignment engine
            task.setdefault("suggested_assignee_name", None)
            constrained_tasks.append(task)

        return constrained_tasks

    def _empty_result(self, note: str) -> dict:
        print(f" Empty decomposition: {note}")
        return {
            "status": "success",
            "tasks": [],
            "total_tasks": 0,
            "task_count_rationale": note,
            "suggested_parallel_capacity": 0,
            "note": note,
        }


if __name__ == "__main__":
    agent = TaskDecompositionAgent()
    for req in ["Fix login authentication", "hii", "Create careers page"]:
        print(f"\n--- {req} ---")
        r = agent.decompose_request(req)
        print(r.get("total_tasks"), r.get("task_count_rationale"))
