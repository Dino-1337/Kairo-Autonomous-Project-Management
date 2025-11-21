import json
import os
import sys
from agents.llm_client import OpenRouterClient

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TaskDecompositionAgent:
    def __init__(self):
        self.llm_client = OpenRouterClient()
        self.company_profile = self.load_company_profile()
        print("✅ Task Decomposition Agent initialized")
    
    def load_company_profile(self):
        """Load company profile from JSON file"""
        try:
            profile_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'company_profile.json')
            with open(profile_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Failed to load company profile: {e}")
            return self.get_default_profile()
    
    def get_default_profile(self):
        """Default profile if config file is missing"""
        return {
            "company_name": "Tech Startup",
            "tech_stack": ["React", "Node.js", "Python", "MongoDB"],
            "team_structure": "Small full-stack team",
            "task_constraints": {"max_tasks": 6, "max_hours_per_task": 8}
        }
    
    def get_clean_prompt(self, user_request: str, context: dict = None) -> str:
        """Clean, focused prompt for task decomposition"""
        constraints = self.company_profile['task_constraints']
        context = context or {}
        
        urgency_note = "URGENT PRIORITY" if context.get('urgency') else "Normal priority"
        deadline_note = f"Deadline: {context.get('deadline')}" if context.get('deadline') != "None" else "No hard deadline"
        
        return f"""
You are a project manager at a tech startup. Break this request into executable tasks.

REQUEST: "{user_request}"
STATUS: {urgency_note}, {deadline_note}

CONTEXT:
- Team: {self.company_profile['team_structure']}
- Tech: {', '.join(self.company_profile['tech_stack'][:5])}
- Philosophy: MVP first, parallel work

RULES:
- Max {constraints['max_tasks']} tasks total
- Each task: 2-8 hours
- Group related work
- Enable parallel execution
- Simple solutions first

Return ONLY JSON array with tasks containing:
- id, title, description, estimated_hours, skills_required, depends_on

Skills to use: design, frontend, backend, copywriting, qa, devops, ai
"""
    
    def decompose_request(self, user_request: str, context: dict = None) -> dict:
        """Clean task decomposition with company context"""
        print(f"🔄 Decomposing: '{user_request}'")
        
        prompt = self.get_clean_prompt(user_request, context)
        
        messages = [
            {"role": "system", "content": "You output only valid JSON. No explanations."},
            {"role": "user", "content": prompt}
        ]
        
        response = self.llm_client.chat_completion(messages, temperature=0.1)
        
        if not response:
            return self.get_fallback_response(user_request)
        
        return self.parse_response(response, user_request)
    
    def parse_response(self, response: str, user_request: str) -> dict:
        """Parse and validate the LLM response"""
        try:
            # Extract JSON from response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                return self.get_fallback_response(user_request)
                
            json_str = response[json_start:json_end]
            tasks = json.loads(json_str)
            
            # Apply constraints
            tasks = self.apply_constraints(tasks)
            
            print(f"✅ Generated {len(tasks)} tasks")
            return {
                "status": "success",
                "tasks": tasks,
                "total_tasks": len(tasks)
            }
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            print(f"❌ JSON parse error: {e}")
            return self.get_fallback_response(user_request)
    
    def apply_constraints(self, tasks):
        """Apply time and task count constraints"""
        constraints = self.company_profile['task_constraints']
        constrained_tasks = []
        
        for task in tasks[:constraints['max_tasks']]:  # Cap task count first
            # Cap hours
            if task.get('estimated_hours', 0) > constraints['max_hours_per_task']:
                task['estimated_hours'] = constraints['max_hours_per_task']
            
            # Ensure required fields
            task.setdefault('depends_on', [])
            task.setdefault('skills_required', [])
            
            constrained_tasks.append(task)
        
        return constrained_tasks
    
    def get_fallback_response(self, user_request: str) -> dict:
        """Fallback response when LLM fails"""
        print("⚠️  Using fallback task decomposition")
        
        # Simple fallback tasks for common request types
        fallback_tasks = [
            {
                "id": 1,
                "title": "Plan and design solution",
                "description": f"Create specifications and design for: {user_request}",
                "estimated_hours": 4,
                "skills_required": ["design"],
                "depends_on": []
            },
            {
                "id": 2, 
                "title": "Implement core functionality",
                "description": "Build the main features and components",
                "estimated_hours": 6,
                "skills_required": ["frontend", "backend"],
                "depends_on": [1]
            },
            {
                "id": 3,
                "title": "Test and deploy",
                "description": "Quality assurance and deployment to production",
                "estimated_hours": 3,
                "skills_required": ["qa", "devops"],
                "depends_on": [2]
            }
        ]
        
        return {
            "status": "success",
            "tasks": fallback_tasks,
            "total_tasks": len(fallback_tasks),
            "note": "Used fallback decomposition"
        }

# Test the refined decomposer
if __name__ == "__main__":
    print("🧪 Testing Refined Task Decomposition...")
    agent = TaskDecompositionAgent()
    
    test_requests = [
        "Fix login authentication",
        "Create careers page",
        "Add AI chatbot to website"
    ]
    
    for request in test_requests:
        print(f"\n--- Testing: '{request}' ---")
        result = agent.decompose_request(request)
        
        if result['status'] == 'success':
            for task in result['tasks']:
                print(f"  {task['id']}. {task['title']} ({task['estimated_hours']}h)")
        else:
            print(f"  ❌ Failed: {result.get('message', 'Unknown error')}")