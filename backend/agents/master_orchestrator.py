class MasterOrchestrator:
    def __init__(self):
        self.workflows = {
            "landing_page": {
                "triggers": ["landing page", "build landing", "create landing", "marketing page"],
                "agent": "task_decomposer",
                "description": "Landing page creation workflow"
            },
            "content_creation": {
                "triggers": ["write blog", "create content", "blog post", "article"],
                "agent": "task_decomposer", 
                "description": "Content creation workflow"
            }
        }
    
    def route_request(self, user_request: str) -> dict:
        """Route user requests to the appropriate workflow"""
        print(f"🎯 Master Orchestrator received: '{user_request}'")
        
        request_lower = user_request.lower()
        
        for workflow_name, config in self.workflows.items():
            for trigger in config["triggers"]:
                if trigger in request_lower:
                    print(f"✅ Matched workflow: {workflow_name}")
                    return {
                        "workflow": workflow_name,
                        "next_agent": config["agent"],
                        "confidence": "high",
                        "description": config["description"]
                    }
        
        # Default fallback
        print("🔀 No specific workflow matched - using default")
        return {
            "workflow": "general",
            "next_agent": "task_decomposer",
            "confidence": "low", 
            "description": "General task decomposition"
        }

# Test the orchestrator
if __name__ == "__main__":
    print("🧪 Testing Master Orchestrator...")
    orchestrator = MasterOrchestrator()
    
    test_requests = [
        "Build landing page for our product",
        "Create a blog post about AI",
        "Just do something random"
    ]
    
    for request in test_requests:
        print(f"\n--- Testing: '{request}' ---")
        result = orchestrator.route_request(request)
        print(f"Routing: {result}") 
