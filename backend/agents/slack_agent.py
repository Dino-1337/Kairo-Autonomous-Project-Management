import os
import sys
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class SlackAgent:
    def __init__(self):
        self.token = os.getenv('SLACK_BOT_TOKEN')
        if self.token:
            self.client = WebClient(token=self.token)
            print("✅ Slack Agent initialized")
        else:
            self.client = None
            print("❌ Slack token missing - notifications disabled")
    
    def find_channel_id(self, channel_name):
        """Find channel ID by channel name"""
        if not self.client:
            print("❌ Slack client not initialized")
            return None
            
        try:
            # Get all channels
            result = self.client.conversations_list()
            channels = result['channels']
            
            print(f"🔍 Looking for channel: #{channel_name}")
            for channel in channels:
                if channel['name'] == channel_name:
                    print(f"✅ Found channel: #{channel['name']} (ID: {channel['id']})")
                    return channel['id']
            
            print(f"❌ Channel #{channel_name} not found")
            print("\nAvailable channels:")
            for channel in channels[:10]:  # Show first 10 channels
                print(f"  - #{channel['name']} (ID: {channel['id']})")
            return None
            
        except SlackApiError as e:
            print(f"❌ Error finding channel: {e}")
            return None
    
    def get_channel_info(self, channel_id):
        """Get information about a channel"""
        if not self.client:
            return None
            
        try:
            result = self.client.conversations_info(channel=channel_id)
            channel = result['channel']
            print(f"📁 Channel Info: #{channel['name']} - {channel['purpose']['value'] if channel.get('purpose') else 'No description'}")
            return channel
        except SlackApiError as e:
            print(f"❌ Failed to get channel info: {e}")
            return None
    
    def send_task_assignment(self, assignment, project_name, channel_id=None):
        """Send task assignment DM to team member"""
        if not self.client or not assignment.get('assignee_slack_id'):
            return False
            
        channel_info = ""
        if channel_id:
            channel_info = f"\n*Project Channel:* <#{channel_id}>"
            
        message = f"""
🎯 *New Task Assignment - {project_name}*

*Task:* {assignment['task_title']}
*Estimated Time:* {assignment['estimated_hours']} hours
*Deadline:* ASAP{channel_info}

*Why you?* {assignment['reason']}

Let me know if you have any questions! 🚀
        """.strip()
        
        try:
            self.client.chat_postMessage(
                channel=assignment['assignee_slack_id'],
                text=message
            )
            print(f"✅ Slack notification sent to {assignment['assignee']}")
            return True
        except SlackApiError as e:
            print(f"❌ Failed to send Slack message: {e}")
            return False
    
    def create_project_channel(self, channel_name):
        """Create a channel for the project"""
        if not self.client:
            return None
            
        try:
            result = self.client.conversations_create(
                name=channel_name,
                is_private=False
            )
            channel_id = result['channel']['id']
            print(f"✅ Created channel: #{channel_name}")
            return channel_id
        except SlackApiError as e:
            print(f"❌ Failed to create channel: {e}")
            return None
    
    def invite_to_channel(self, channel_id, user_slack_id):
        """Invite user to channel"""
        if not self.client:
            return False
            
        try:
            self.client.conversations_invite(
                channel=channel_id,
                users=user_slack_id
            )
            print(f"✅ Invited {user_slack_id} to channel")
            return True
        except SlackApiError as e:
            # If user is already in channel, that's fine
            if e.response['error'] == 'already_in_channel':
                print(f"✅ User {user_slack_id} already in channel")
                return True
            print(f"❌ Failed to invite {user_slack_id} to channel: {e}")
            return False
    
    def post_channel_message(self, channel_id, message):
        """Post message to channel"""
        if not self.client:
            return False
            
        try:
            self.client.chat_postMessage(
                channel=channel_id,
                text=message
            )
            print(f"✅ Posted message to channel {channel_id}")
            return True
        except SlackApiError as e:
            print(f"❌ Failed to post channel message: {e}")
            return False

# Test the enhanced Slack agent
if __name__ == "__main__":
    print("🧪 Testing Enhanced Slack Agent...")
    agent = SlackAgent()
    
    if agent.client:
        print("✅ Slack is ready!")
        print("\nAvailable methods:")
        print("  - find_channel_id(channel_name)")
        print("  - get_channel_info(channel_id)")
        print("  - send_task_assignment()")
        print("  - create_project_channel()") 
        print("  - invite_to_channel()")
        print("  - post_channel_message()")
        
        # Test channel finding
        print("\n🔍 Testing channel finder...")
        channel_id = agent.find_channel_id("all-startup-test")
        if channel_id:
            agent.get_channel_info(channel_id)
    else:
        print("❌ Slack not configured")