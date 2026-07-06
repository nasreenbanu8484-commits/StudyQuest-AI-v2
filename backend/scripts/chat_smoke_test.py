import urllib.request
import json
import sys

def run_post(base_url, endpoint, payload):
    url = f"{base_url}{endpoint}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 500, str(e)

def main():
    base_url = "http://localhost:8000"
    print(f"--- StudyQuest AI Coach Chat Integration Test: {base_url} ---")
    
    # 1. Reset Biology Demo so we have data
    print("\n1. Seeding active study plan...")
    req = urllib.request.Request(f"{base_url}/api/demo/reset", method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            pass
    except Exception as e:
        print(f"❌ Failed to seed active plan: {e}")
        sys.exit(1)
    print("✓ Study plan seeded successfully.")

    # 2. Test Plan intent
    print("\n2. Querying: 'tell me about my plan'...")
    status, res = run_post(base_url, "/api/chat", {"message": "tell me about my plan"})
    if status != 200:
        print(f"❌ Chat query failed (HTTP {status}): {res}")
        sys.exit(1)
    reply = res.get("coach_chat_reply", "")
    print(f"✓ Coach Reply: \"{reply}\"")
    if "Planner Agent" not in reply or "topics" not in reply:
        print("❌ Unexpected response for plan query.")
        sys.exit(1)
        
    # 3. Test Spaced Repetition / Revision intent
    print("\n3. Querying: 'show my revisions'...")
    status, res = run_post(base_url, "/api/chat", {"message": "show my revisions"})
    if status != 200:
        print(f"❌ Chat query failed (HTTP {status}): {res}")
        sys.exit(1)
    reply = res.get("coach_chat_reply", "")
    print(f"✓ Coach Reply: \"{reply}\"")
    if "spaced repetition" not in reply:
        print("❌ Unexpected response for revision query.")
        sys.exit(1)

    # 4. Test default greeting fallback
    print("\n4. Querying greeting fallback...")
    status, res = run_post(base_url, "/api/chat", {"message": "hello!"})
    if status != 200:
        print(f"❌ Chat query failed (HTTP {status}): {res}")
        sys.exit(1)
    reply = res.get("coach_chat_reply", "")
    print(f"✓ Coach Reply: \"{reply}\"")
    if "Study Coach" not in reply:
        print("❌ Unexpected response for greeting fallback.")
        sys.exit(1)

    print("\n🎉 COACH AGENT CHAT ROUTING TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
