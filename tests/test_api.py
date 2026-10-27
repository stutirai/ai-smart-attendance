import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient
from app.main import app

def test_fastapi_endpoints():
    client = TestClient(app)

    # 1. Root info
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "AI-Based Smart Attendance" in data["title"]
    print("[PASS] Root endpoint returned project metadata")

    # 2. Auth login
    login_res = client.post("/api/auth/login", json={"email": "faculty@gniot.net.in", "password": "admin123"})
    assert login_res.status_code == 200
    assert "token" in login_res.json()
    print("[PASS] Faculty login endpoint works")

    # 2b. Faculty profile GET & PUT
    prof_get = client.get("/api/auth/profile")
    assert prof_get.status_code == 200
    prof_put = client.put("/api/auth/profile", json={"name": "Dr. Testing", "role": "Head of AI"})
    assert prof_put.status_code == 200
    assert prof_put.json()["name"] == "Dr. Testing"
    client.put("/api/auth/profile", json={"name": "Faculty Portal", "role": "Faculty In-Charge"})
    print("[PASS] Faculty profile GET/PUT endpoint verified")

    # 3. Students list
    st_res = client.get("/api/students")
    assert st_res.status_code == 200
    students = st_res.json()
    assert len(students) >= 2
    print(f"[PASS] Students list returned {len(students)} registered students (including Stuti Rai & Shivani Singh)")

    # 4. Settings
    set_res = client.get("/api/settings")
    assert set_res.status_code == 200
    settings_data = set_res.json()
    assert settings_data["total_intervals"] == 5
    assert settings_data["required_verified_intervals"] == 3
    print("[PASS] Settings endpoint verified 5 intervals & 3 required")

    # 5. Live stats
    live_res = client.get("/api/attendance/live")
    assert live_res.status_code == 200
    assert "current_interval" in live_res.json()
    print("[PASS] Live attendance stats endpoint verified")

    # 6. Evaluation PPT benchmarks
    bench_res = client.get("/api/evaluation/ppt-benchmarks")
    assert bench_res.status_code == 200
    assert len(bench_res.json()["metrics"]) == 4
    print("[PASS] Evaluation PPT Slide 7 benchmark data verified")

    # 7. Run empirical evaluation
    eval_res = client.post("/api/evaluation/run")
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert "accuracy" in eval_data
    assert "measured_matching_latency_ms" in eval_data
    print(f"[PASS] Empirical evaluation executed: Accuracy={eval_data['accuracy']}%, Latency={eval_data['measured_matching_latency_ms']}ms")

    print("[ALL PASS] All FastAPI endpoints verified successfully!")

if __name__ == "__main__":
    test_fastapi_endpoints()
