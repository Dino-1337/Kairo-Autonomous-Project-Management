"""LLM helpers for meeting insights and project progress narrative."""
import json
import re

from agents.llm_client import OpenRouterClient


def extract_meeting_insights(raw_text: str) -> dict:
    """
    Structured capture: action items, bugs, feature ideas, decisions, risks.
    Returns dict with list values (possibly empty).
    """
    client = OpenRouterClient()
    prompt = f"""Analyze these meeting notes and extract structured items. Return ONLY valid JSON:
{{
  "action_items": ["..."],
  "bugs": ["..."],
  "feature_ideas": ["..."],
  "decisions": ["..."],
  "risks": ["..."]
}}
Use empty arrays if a category has nothing. Notes:
---
{raw_text[:12000]}
---
"""
    messages = [
        {"role": "system", "content": "You output only one JSON object. No markdown."},
        {"role": "user", "content": prompt},
    ]
    resp = client.chat_completion(messages, temperature=0.2)
    if not resp:
        return {
            "action_items": [],
            "bugs": [],
            "feature_ideas": [],
            "decisions": [],
            "risks": [],
        }
    m = re.search(r"\{[\s\S]*\}", resp)
    if not m:
        return {
            "action_items": [],
            "bugs": [],
            "feature_ideas": [],
            "decisions": [],
            "risks": [],
        }
    try:
        data = json.loads(m.group(0))
        out = {}
        for k in ("action_items", "bugs", "feature_ideas", "decisions", "risks"):
            v = data.get(k)
            out[k] = [str(x) for x in v] if isinstance(v, list) else []
        return out
    except json.JSONDecodeError:
        return {
            "action_items": [],
            "bugs": [],
            "feature_ideas": [],
            "decisions": [],
            "risks": [],
        }


def generate_progress_summary(
    project_name: str,
    ideas_lines: str,
    tasks_lines: str,
    notes_lines: str,
    events_lines: str,
) -> str:
    """Short markdown narrative for contextual progress."""
    client = OpenRouterClient()
    prompt = f"""Project: {project_name}

You are writing a brief internal progress note (not metrics). Use the snippets below.
Output 4–8 short bullet points in markdown: what shipped, what's in flight, themes from meetings, risks/next steps.
If data is sparse, say so briefly.

## Recent ideas
{ideas_lines or "(none)"}

## Tasks (status)
{tasks_lines or "(none)"}

## Meeting notes / summaries
{notes_lines or "(none)"}

## Recent timeline events
{events_lines or "(none)"}
"""
    messages = [
        {"role": "system", "content": "You write concise, factual project progress notes. Markdown bullets only."},
        {"role": "user", "content": prompt},
    ]
    resp = client.chat_completion(messages, temperature=0.35)
    return (resp or "No summary could be generated.").strip()
