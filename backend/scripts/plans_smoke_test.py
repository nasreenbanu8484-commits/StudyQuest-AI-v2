import urllib.request
import json
import sys

def run_request(base_url, endpoint, method="GET", payload=None):
    url = f"{base_url}{endpoint}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
            return e.code, err_body
        except Exception:
            return e.code, e.reason
    except Exception as e:
        return 500, str(e)

def main():
    base_url = "http://localhost:8000"
    print(f"--- StudyQuest AI Plans Management Integration Test: {base_url} ---")
    
    # 1. Reset / Seed Biology Demo
    print("\n1. Resetting Biology Demo plan...")
    status, res = run_request(base_url, "/api/demo/reset", "POST")
    if status != 200:
        print(f"❌ Demo reset failed (HTTP {status}): {res}")
        sys.exit(1)
    print("✓ Biology Demo initialized.")

    # 2. List study plans
    print("\n2. Listing study plans...")
    status, res = run_request(base_url, "/api/plans", "GET")
    if status != 200:
        print(f"❌ List plans failed (HTTP {status}): {res}")
        sys.exit(1)
    print(f"✓ Found {len(res)} study plans.")
    for p in res:
        print(f"  - Plan ID: {p['id']}, Name: {p['name']}, Status: {p['status']}, Progress: {p['progress_percentage']}%")
    if len(res) == 0:
        print("❌ Expecting at least 1 study plan.")
        sys.exit(1)
        
    target_plan_id = res[0]["id"]
    
    # 3. Duplicate study plan
    print(f"\n3. Duplicating plan ID {target_plan_id}...")
    status, res = run_request(base_url, "/api/plans/duplicate", "POST", {"exam_id": target_plan_id})
    if status != 200:
        print(f"❌ Duplicate plan failed (HTTP {status}): {res}")
        sys.exit(1)
    print(f"✓ Duplicated plan. Now have {len(res)} study plans.")
    
    duplicate_plan = [p for p in res if "(Copy)" in p["name"]]
    if len(duplicate_plan) == 0:
        print("❌ Could not find duplicated plan in the list.")
        sys.exit(1)
    duplicate_id = duplicate_plan[0]["id"]
    print(f"  - Duplicated Plan ID: {duplicate_id}, Name: {duplicate_plan[0]['name']}")
    
    # 4. Archive plan
    print(f"\n4. Archiving duplicate plan ID {duplicate_id}...")
    status, res = run_request(base_url, "/api/plans/archive", "POST", {"exam_id": duplicate_id})
    if status != 200:
        print(f"❌ Archive plan failed (HTTP {status}): {res}")
        sys.exit(1)
    archived_plan = [p for p in res if p["id"] == duplicate_id]
    if len(archived_plan) == 0 or archived_plan[0]["status"] != "Archived":
        print(f"❌ Plan status is not Archived: {archived_plan}")
        sys.exit(1)
    print("✓ Plan archived successfully.")
    
    # 5. Delete plan
    print(f"\n5. Deleting archived plan ID {duplicate_id}...")
    status, res = run_request(base_url, "/api/plans/delete", "POST", {"exam_id": duplicate_id})
    if status != 200:
        print(f"❌ Delete plan failed (HTTP {status}): {res}")
        sys.exit(1)
    deleted_check = [p for p in res if p["id"] == duplicate_id]
    if len(deleted_check) > 0:
        print("❌ Plan was not deleted from the list.")
        sys.exit(1)
    print("✓ Plan deleted successfully.")
    
    # 6. Switch plan (we will switch to the active plan to verify it is successful)
    print(f"\n6. Testing plan switching to ID {target_plan_id}...")
    status, res = run_request(base_url, "/api/plans/switch", "POST", {"exam_id": target_plan_id})
    if status != 200:
        print(f"❌ Switch plan failed (HTTP {status}): {res}")
        sys.exit(1)
    print(f"✓ Switched active plan ID to {res['active_exam']['id']}.")
    
    # 7. Reset active plan pointer (start a new quest)
    print("\n7. Resetting active study plan to start a new quest...")
    status, res = run_request(base_url, "/api/plans/reset", "POST")
    if status != 200:
        print(f"❌ Reset plan failed (HTTP {status}): {res}")
        sys.exit(1)
    print("✓ Active study plan cleared.")

    # 8. Verify list of previous plans is still preserved (non-empty!)
    print("\n8. Verifying history is preserved...")
    status, res = run_request(base_url, "/api/plans", "GET")
    if status != 200:
        print(f"❌ List plans after reset failed (HTTP {status}): {res}")
        sys.exit(1)
    if len(res) == 0:
        print("❌ History was deleted during reset! Previous study plans must be maintained.")
        sys.exit(1)
    print(f"✓ History preserved: Found {len(res)} study plans after active reset.")
    
    print("\n🎉 INTEGRATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
