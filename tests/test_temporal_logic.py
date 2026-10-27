import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.attendance_service import AttendanceService
from app.core.config import settings

def test_temporal_attendance_rules():
    service = AttendanceService()
    
    # Simulate Student 1: Stuti Rai (Verified in 4 out of 5 intervals)
    student_1_id = 101
    service.student_interval_verifications[student_1_id] = {
        1: True,
        2: True,
        3: True,
        4: False,  # Missing one interval due to writing / looking down
        5: True
    }
    
    # Simulate Student 2: Shivani Singh (Verified in 2 out of 5 intervals)
    student_2_id = 102
    service.student_interval_verifications[student_2_id] = {
        1: True,
        2: False,
        3: False,
        4: True,
        5: False
    }

    # Evaluate decision logic
    v1 = sum(1 for v in service.student_interval_verifications[student_1_id].values() if v)
    status_1 = "PRESENT" if v1 >= settings.REQUIRED_VERIFIED_INTERVALS else "NOT_VERIFIED"

    v2 = sum(1 for v in service.student_interval_verifications[student_2_id].values() if v)
    status_2 = "PRESENT" if v2 >= settings.REQUIRED_VERIFIED_INTERVALS else "NOT_VERIFIED"

    assert v1 == 4, f"Expected 4 verified intervals, got {v1}"
    assert status_1 == "PRESENT", f"Expected PRESENT for 4/5, got {status_1}"

    assert v2 == 2, f"Expected 2 verified intervals, got {v2}"
    assert status_2 == "NOT_VERIFIED", f"Expected NOT_VERIFIED for 2/5, got {status_2}"

    print(f"[PASS] Student 1: {v1}/5 verified -> {status_1}")
    print(f"[PASS] Student 2: {v2}/5 verified -> {status_2}")
    print("[PASS] Temporal 3/5 verification rule test PASSED successfully!")

if __name__ == "__main__":
    test_temporal_attendance_rules()
