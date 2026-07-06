import urllib.request
import urllib.parse
import json
import sys

API_BASE = "http://localhost:8000"

def run_post(endpoint, payload=None):
    url = f"{API_BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.reason
    except Exception as e:
        return 500, str(e)

def run_get(endpoint):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.reason
    except Exception as e:
        return 500, str(e)

def test_invalid_upload():
    # Test file upload boundaries by preparing a multipart request for unsafe file
    url = f"{API_BASE}/api/syllabus/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    
    body_parts = [
        f"--{boundary}",
        'Content-Disposition: form-data; name="file"; filename="hack.exe"',
        "Content-Type: application/octet-stream",
        "",
        "malicious binary contents",
        f"--{boundary}--",
        ""
    ]
    data = "\r\n".join(body_parts).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 500, str(e)

def main():
    print("--- StudyQuest AI Backend Smoke Tests ---")
    
    # 1. Reset Demo
    print("\n1. Resetting Biology Demo...")
    status, res = run_post("/api/demo/reset")
    if status != 200:
        print(f"❌ Reset failed (HTTP {status}): {res}")
        sys.exit(1)
    print("✓ Biology Demo reset successfully.")
    
    # 2. Get Dashboard
    print("\n2. Fetching Dashboard State...")
    status, dash = run_get("/api/dashboard")
    if status != 200:
        print(f"❌ Dashboard fetch failed: {dash}")
        sys.exit(1)
    assert dash["user"]["xp"] == 380, "Expected starting XP to be 380"
    assert dash["user"]["daily_streak"] == 4, "Expected starting streak to be 4"
    assert dash["today_mission"]["title"] == "Study Cell Division", "Expected first mission to study Cell Division"
    print("✓ Starting dashboard metrics match Biology seed criteria.")

    # 3. Complete Cell Division
    print("\n3. Recording Cell Division complete (confidence 3)...")
    payload = {
        "mission_id": dash["today_mission"]["id"],
        "topic_id": dash["today_mission"]["topic_id"],
        "confidence": 3,
        "actual_hours": 2.0
    }
    status, updated_dash = run_post("/api/sessions/complete", payload)
    if status != 200:
        print(f"❌ Session complete failed: {updated_dash}")
        sys.exit(1)
        
    assert updated_dash["user"]["xp"] == 500, f"Expected Level Up to 500 XP, got {updated_dash['user']['xp']}"
    assert updated_dash["user"]["daily_streak"] == 5, f"Expected streak increments to 5, got {updated_dash['user']['daily_streak']}"
    assert len(updated_dash["upcoming_revisions"]) > 0, "Expected a revision to be scheduled"
    
    # Check trace logs
    traces = updated_dash.get("agent_traces", [])
    assert len(traces) >= 5, f"Expected 5 agent workflow traces, got {len(traces)}"
    print("✓ Unified multi-agent coordination traces recorded in SQLite.")
    print("✓ XP updated, streak updated to 5, level up verified.")

    # 4. Upload validation rejection
    print("\n4. Testing upload validation security rules...")
    status, err_msg = test_invalid_upload()
    if status != 400:
        print(f"❌ Security violation: Expected upload rejection status 400, got {status}")
        sys.exit(1)
    print("✓ Upload safely rejected block with code 400.")

    print("\n🎉 ALL SMOKE TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
