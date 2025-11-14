import os
import sys
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config.settings import settings
    print("✅ Successfully imported settings")
except ImportError as e:
    print(f"❌ Import error: {e}")

def test_slack_connection():
    """Test Slack connection and verify team members"""
    
    # Get Slack token from environment
    token = os.getenv('SLACK_BOT_TOKEN')
    if not token:
        print("❌ SLACK_BOT_TOKEN not found in environment variables")
        print("💡 Make sure you have added it to your .env file:")
        print("   SLACK_BOT_TOKEN=xoxb-your-token-here")
        return False
    
    print(f"🔑 Found Slack token: {token[:20]}...")
    
    # Initialize Slack client
    try:
        client = WebClient(token=token)
        print("✅ Slack client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Slack client: {e}")
        return False
    
    # Test 1: Verify authentication
    print("\n🧪 Test 1: Verifying authentication...")
    try:
        auth_test = client.auth_test()
        print(f"✅ Authenticated as: {auth_test['user']}")
        print(f"✅ Workspace: {auth_test['team']}")
        print(f"✅ URL: {auth_test['url']}")
    except SlackApiError as e:
        print(f"❌ Authentication failed: {e.response['error']}")
        return False
    
    # Test 2: Get all users in workspace
    print("\n🧪 Test 2: Fetching workspace users...")
    try:
        users_result = client.users_list()
        users = users_result['members']
        
        # Filter out bots and deleted users
        real_users = [user for user in users if not user['deleted'] and not user['is_bot']]
        print(f"✅ Found {len(real_users)} real users in workspace")
        
        # Display users
        print("\n👥 Workspace Users:")
        for user in real_users:
            profile = user.get('profile', {})
            print(f"   - {user['real_name']} ({user['name']}) - ID: {user['id']}")
            if profile.get('email'):
                print(f"     Email: {profile['email']}")
        
    except SlackApiError as e:
        print(f"❌ Failed to fetch users: {e.response['error']}")
        return False
    
    # Test 3: Verify our team members exist
    print("\n🧪 Test 3: Verifying configured team members...")
    
    # Load team config
    try:
        import json
        config_path = os.path.join(os.path.dirname(__file__), 'config', 'team_config.json')
        with open(config_path, 'r') as f:
            team_config = json.load(f)
        print(f"✅ Loaded team config with {len(team_config)} members")
    except Exception as e:
        print(f"❌ Failed to load team config: {e}")
        return False
    
    # Create mapping of Slack ID to user info
    slack_users_by_id = {user['id']: user for user in real_users}
    
    # Check each team member
    all_members_found = True
    print("\n🔍 Checking team members:")
    for member in team_config:
        slack_id = member['slack_id']
        if slack_id in slack_users_by_id:
            slack_user = slack_users_by_id[slack_id]
            print(f"   ✅ {member['name']} - Found: {slack_user['real_name']} (ID: {slack_id})")
            
            # Verify email matches if available
            slack_email = slack_user.get('profile', {}).get('email', '')
            config_email = member.get('email', '')
            if slack_email and config_email and slack_email.lower() != config_email.lower():
                print(f"      ⚠️  Email mismatch: Config='{config_email}' vs Slack='{slack_email}'")
        else:
            print(f"   ❌ {member['name']} - NOT FOUND (ID: {slack_id})")
            all_members_found = False
    
    # Test 4: Send a test message to yourself
    print("\n🧪 Test 4: Sending test message...")
    try:
        # Send to the first team member (you)
        test_member = team_config[0]
        test_message = f"🧪 Test message from Startup Agent! If you're seeing this, Slack integration is working! 🎉"
        
        result = client.chat_postMessage(
            channel=test_member['slack_id'],
            text=test_message
        )
        print(f"✅ Test message sent to {test_member['name']}")
        print(f"   Message timestamp: {result['ts']}")
        
    except SlackApiError as e:
        print(f"❌ Failed to send test message: {e.response['error']}")
        all_members_found = False
    
    # Final result
    print("\n" + "="*50)
    if all_members_found:
        print("🎉 ALL TESTS PASSED! Slack integration is ready!")
        print("🚀 You can now proceed with the full implementation.")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
    print("="*50)
    
    return all_members_found

if __name__ == "__main__":
    print("🚀 Slack Connection Test")
    print("="*30)
    test_slack_connection()