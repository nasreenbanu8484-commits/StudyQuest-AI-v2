import urllib.request
import json
import sys

def run_get(base_url, endpoint):
    url = f"{base_url}{endpoint}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.reason
    except Exception as e:
        return 500, str(e)

def main():
    if len(sys.argv) < 2:
        print("Usage: python prod_smoke_test.py <backend_base_url>")
        print("Example: python prod_smoke_test.py https://studyquest-backend-xyz.run.app")
        sys.exit(1)
        
    base_url = sys.argv[1].rstrip("/")
    print(f"--- StudyQuest AI Production Smoke Test: {base_url} ---")
    
    # 1. Health Check
    print("\nChecking /health endpoint...")
    status, res = run_get(base_url, "/health")
    if status != 200:
        print(f"❌ Health check failed (HTTP {status}): {res}")
        sys.exit(1)
    print("✓ Backend process is healthy.")
    
    # 2. Readiness Check
    print("\nChecking /ready endpoint...")
    status, res = run_get(base_url, "/ready")
    if status != 200:
        print(f"❌ Readiness check failed (HTTP {status}): {res}")
        sys.exit(1)
    print("✓ Backend database and services are ready.")
    
    # 3. Dashboard Structure
    print("\nChecking dashboard API structure...")
    status, res = run_get(base_url, "/api/dashboard")
    if status != 200:
        print(f"❌ Dashboard check failed (HTTP {status}): {res}")
        sys.exit(1)
    if "user" not in res or "fallback_mode" not in res:
        print("❌ Dashboard response missing expected properties.")
        sys.exit(1)
    print("✓ Dashboard schema verified successfully.")
    
    print("\n🎉 PRODUCTION SMOKE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
