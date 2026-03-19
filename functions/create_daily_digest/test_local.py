"""Local test wrapper for the create_daily_digest function"""

import json
import os
import traceback

# Set up environment variables for testing
os.environ["APPWRITE_API_KEY"] = os.getenv("APPWRITE_API_KEY", "test_api_key")
os.environ["GOOGLE_GEMINI_API_KEY"] = os.getenv("GOOGLE_GEMINI_API_KEY", "")


class MockResponse:
    """Mock response object mimicking Appwrite context.res"""

    def __init__(self):
        self.data = None
        self.status_code = 200

    def json(self, data, status_code=200):
        """Store JSON response"""
        self.data = data
        self.status_code = status_code
        return data


class MockRequest:
    """Mock request object mimicking Appwrite context.req"""

    def __init__(self):
        # Daily digest function doesn't use request body
        self.body = "{}"


class MockContext:
    """Mock context object mimicking Appwrite function context"""

    def __init__(self):
        self.req = MockRequest()
        self.res = MockResponse()
        self.logs = []

    def log(self, message: str):
        """Log message for debugging"""
        self.logs.append(message)
        print(f"[LOG] {message}")

    def error(self, message: str):
        """Error message for debugging"""
        self.logs.append(f"ERROR: {message}")
        print(f"[ERROR] {message}")


def test_daily_digest():
    """Test the create_daily_digest function locally"""

    # Check required environment variables
    required_vars = [
        "APPWRITE_API_KEY",
        "GOOGLE_GEMINI_API_KEY",
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print("❌ Error: Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n   Please set them before running this script:")
        print("   export APPWRITE_API_KEY='your-api-key'")
        print("   export GOOGLE_GEMINI_API_KEY='your-gemini-api-key'")
        return None

    print("🚀 Testing create_daily_digest function")
    print("-" * 60)
    print("⚠️  Note: This will attempt to connect to your Appwrite database")
    print("   Make sure you have test data with users who have daily_digest=true")
    print("-" * 60)

    # Create mock context (no request body needed for daily digest)
    context = MockContext()

    try:
        # Import and call the main function
        from create_daily_digest import main

        result = main(context)

        print("-" * 60)
        print("✅ Function executed successfully!\n")

        print("📋 Execution Summary:")
        print(f"   Status Code: {context.res.status_code}")

        print("\n📋 Response:")
        if context.res.data:
            print(json.dumps(context.res.data, indent=2))
        else:
            print("   No response data")

        print("\n📋 All Logs:")
        for log in context.logs:
            print(f"   {log}")

        return context.res.data

    except Exception as e:
        print("-" * 60)
        print(f"❌ Error executing function: {e}")
        print("\n📋 Full Stack Trace (line numbers included):")
        formatted_tb = traceback.format_exc()
        print(formatted_tb)
        print("\n📋 Logs before error:")
        for log in context.logs:
            print(f"   {log}")
        return None


def test_with_dry_run():
    """Test the function with a dry run (no actual database writes)"""
    print("🧪 Testing create_daily_digest function (DRY RUN)")
    print("-" * 60)
    print("⚠️  This is a dry run - no actual database operations will be performed")
    print("   Set DRY_RUN=true to enable this mode")
    print("-" * 60)

    # This would require modifying the main function to support dry run mode
    # For now, just show the environment setup
    print("📋 Environment Check:")
    print(
        f"   APPWRITE_API_KEY: {'✅ Set' if os.getenv('APPWRITE_API_KEY') else '❌ Not set'}"
    )
    print(
        f"   GOOGLE_GEMINI_API_KEY: {'✅ Set' if os.getenv('GOOGLE_GEMINI_API_KEY') else '❌ Not set'}"
    )

    print("\n💡 To run the actual function:")
    print("   python test_local.py run")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "run":
        # Run the actual function
        result = test_daily_digest()
    else:
        # Show dry run info
        test_with_dry_run()
