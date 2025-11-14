import json
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config.settings import settings
    print("✅ Successfully imported settings for assignment engine")
except ImportError as e:
    print(f"❌ Import error: {e}")

class AssignmentEngine:
    def __init__(self):
        self.team_config = self.load_team_config()
        print(f"👥 Assignment Engine initialized with {len(self.team_config)} team members")
    
    def load_team_config(self):
        """Load team configuration from JSON file"""
        try:
            # Try to load from the config path
            config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'team_config.json')
            with open(config_path, 'r') as f:
                team_data = json.load(f)
                print(f"✅ Loaded team config from {config_path}")
                return team_data
        except Exception as e:
            print(f"❌ Failed to load team config: {e}")
            # Fallback to basic team
            return [
                {"name": "Sarah", "skills": ["copywriting", "content"], "slack_id": "U123"},
                {"name": "Rohit", "skills": ["design", "ui/ux"], "slack_id": "U124"},
                {"name": "Alex", "skills": ["development", "web"], "slack_id": "U125"}
            ]
    
    def assign_tasks(self, tasks):
        """Assign all tasks to team members"""
        print(f"🎯 Starting task assignment for {len(tasks)} tasks...")
        
        assignments = []
        assignment_details = []
        
        # Sort tasks by ID to maintain dependency order
        sorted_tasks = sorted(tasks, key=lambda x: x['id'])
        
        for task in sorted_tasks:
            assignee = self.find_best_assignee(task)
            
            assignment_detail = {
                'task_id': task['id'],
                'task_title': task['title'],
                'assignee': assignee['name'],
                'assignee_slack_id': assignee.get('slack_id', ''),
                'reason': f"Skill match for {task.get('skills_required', [])}",
                'estimated_hours': task.get('estimated_hours', 0)
            }
            
            assignments.append(assignment_detail)
            print(f"   ✅ Task {task['id']} '{task['title']}' assigned to {assignee['name']}")
        
        return {
            'status': 'success',
            'assignments': assignments,
            'total_tasks_assigned': len(assignments)
        }
    
    def find_best_assignee(self, task):
        """Find the best team member for a task based on skills"""
        required_skills = task.get('skills_required', [])
        task_id = task['id']
        
        print(f"🔍 Finding assignee for task {task_id}: {task['title']}")
        print(f"   Required skills: {required_skills}")
        
        best_match = None
        best_score = 0
        
        for member in self.team_config:
            # Calculate skill match score
            member_skills = set(member.get('skills', []))
            required_skills_set = set(required_skills)
            
            # Convert to lowercase for case-insensitive matching
            member_skills_lower = {s.lower() for s in member_skills}
            required_skills_lower = {s.lower() for s in required_skills_set}
            
            matching_skills = member_skills_lower.intersection(required_skills_lower)
            score = len(matching_skills)
            
            print(f"   {member['name']}: {member_skills} -> score: {score}")
            
            if score > best_score:
                best_score = score
                best_match = member
        
        if best_match:
            print(f"   ✅ Best match: {best_match['name']} (score: {best_score})")
            return best_match
        else:
            print(f"   ⚠️  No strong match found, using fallback")
            # Fallback to first member
            return self.team_config[0]

# Test the assignment engine
if __name__ == "__main__":
    print("🧪 Testing Assignment Engine...")
    engine = AssignmentEngine()
    
    # Sample tasks from our decomposition
    sample_tasks = [
        {
            "id": 1,
            "title": "Define landing page goals and target audience",
            "description": "Identify key objectives and user personas for the landing page",
            "estimated_hours": 2,
            "skills_required": ["marketing", "research"],
            "depends_on": []
        },
        {
            "id": 2,
            "title": "Write hero section copy",
            "description": "Create compelling headline and subheadline that explains the value proposition",
            "estimated_hours": 4,
            "skills_required": ["copywriting"],
            "depends_on": [1]
        }
    ]
    
    result = engine.assign_tasks(sample_tasks)
    print(f"\n🎯 Assignment Result: {json.dumps(result, indent=2)}")