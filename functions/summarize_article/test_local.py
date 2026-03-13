"""Local test wrapper for the summarize_article function"""

import json
import os
from typing import Any, Dict
import traceback

os.environ["APPWRITE_API_KEY"] = os.getenv("APPWRITE_API_KEY", "test_api_key")
os.environ["GOOGLE_GEMINI_API_KEY"] = os.getenv("GOOGLE_GEMINI_API_KEY", "")


class MockResponse:
    """Mock response object mimicking Appwrite context.res"""

    def __init__(self):
        self.data = None

    def json(self, data: Dict[str, Any]):
        """Store JSON response"""
        self.data = data
        return data


class MockRequest:
    """Mock request object mimicking Appwrite context.req"""

    def __init__(self, body: str):
        self.body = body


class MockContext:
    """Mock context object mimicking Appwrite function context"""

    def __init__(self, request_body: Dict[str, Any]):
        self.req = MockRequest(json.dumps(request_body))
        self.res = MockResponse()
        self.logs = []

    def log(self, message: str):
        """Log message for debugging"""
        self.logs.append(message)
        print(f"[LOG] {message}")


def test_summarize(
    article_url: str, article_id: str | None = None, user_id: str = "test_user"
):
    """Test the summarize function locally"""

    if not os.getenv("GOOGLE_GEMINI_API_KEY"):
        print("❌ Error: GOOGLE_GEMINI_API_KEY environment variable is not set")
        print("   Please set it before running this script:")
        print("   export GOOGLE_GEMINI_API_KEY='your-api-key'")
        return None

    print(f"🚀 Testing summarize function with URL: {article_url}")
    print("-" * 60)

    # Create mock context with request data
    request_data = {
        "user_id": user_id,
        "article_url": article_url,
        "article_id": article_id,
    }

    context = MockContext(request_data)

    try:
        # Import and call the main function
        from summarize import main

        result = main(context)

        print("-" * 60)
        print("✅ Function executed successfully!\n")
        print("📋 Logs:")
        for log in context.logs:
            print(f"   {log}")

        print("\n📝 Response:")
        print(json.dumps(context.res.data, indent=2))

        return context.res.data

    except Exception as e:
        print("-" * 60)
        print(f"❌ Error executing function: {e}")
        print("\n📋 Full Stack Trace:")
        traceback.print_exc()
        print("\n📋 Logs before error:")
        for log in context.logs:
            print(f"   {log}")
        return None


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = "https://techcrunch.com/2024/01/15/ai-advances/"

    article_id = sys.argv[2] if len(sys.argv) > 2 else None

    result = test_summarize(url, article_id)
