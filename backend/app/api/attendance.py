import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.models import AttendanceRecord, AttendanceSession, Student
from app.schemas.schemas import AttendanceRecordResponse, LiveSystemStats
from app.services.attendance_service import attendance_service
from app.vision.pipeline import vision_pipeline

router = APIRouter(prefix="/attendance", tags=["Attendance Records"])

@router.get("/live", response_model=LiveSystemStats)
def get_live_stats():
    stats = attendance_service.get_live_stats()
    stats["camera_connected"] = vision_pipeline.camera.is_running
    stats["fps"] = vision_pipeline.camera.get_fps()
    return stats

@router.get("/today")
def get_today_attendance(db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), datetime.min.time())
    
    total_students = db.query(Student).count()
    
    # Query latest records from today's sessions
    today_records = db.query(AttendanceRecord).join(AttendanceSession).filter(
        AttendanceSession.start_time >= today_start
    ).all()

    present_count = sum(1 for r in today_records if r.final_status == "PRESENT")
    absent_count = sum(1 for r in today_records if r.final_status != "PRESENT")
    
    # In case no session ran today yet
    if not today_records:
        present_count = 0
        absent_count = total_students

    rate = round((present_count / max(total_students, 1)) * 100.0, 1)

    record_items = []
    for r in today_records:
        st = r.student
        det = {}
        if r.intervals_detail:
            try:
                det = json.loads(r.intervals_detail)
            except Exception:
                det = {}

        record_items.append({
            "id": r.id,
            "student_name": st.name if st else "Unknown",
            "roll_number": st.roll_number if st else "N/A",
            "department": st.department if st else "AI & AI/DS",
            "status": r.final_status,
            "verification_count": f"{r.verified_intervals_count}/{r.total_intervals}",
            "verified_ratio": r.verified_intervals_count / max(r.total_intervals, 1),
            "last_verified": r.finalized_at.strftime("%I:%M %p") if r.finalized_at else "N/A",
            "confidence": r.average_confidence,
            "liveness": r.liveness_overall,
            "intervals_detail": det
        })

    active_session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()

    return {
        "total_students": total_students,
        "present_today": present_count,
        "absent_today": absent_count,
        "attendance_rate": rate,
        "current_session": active_session.session_code if active_session else "None Active",
        "records": record_items
    }

@router.get("/history")
def get_attendance_history(
    date_filter: Optional[str] = Query(None, description="YYYY-MM-DD"),
    subject_filter: Optional[str] = Query(None),
    section_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceRecord).join(AttendanceSession)

    if subject_filter:
        query = query.filter(AttendanceSession.subject.ilike(f"%{subject_filter}%"))
    if section_filter:
        query = query.filter(AttendanceSession.section == section_filter)
    if date_filter:
        try:
            d = datetime.strptime(date_filter, "%Y-%m-%d").date()
            d_start = datetime.combine(d, datetime.min.time())
            d_end = datetime.combine(d, datetime.max.time())
            query = query.filter(AttendanceSession.start_time.between(d_start, d_end))
        except ValueError:
            pass

    records = query.order_by(AttendanceRecord.finalized_at.desc()).all()

    total_present = sum(1 for r in records if r.final_status == "PRESENT")
    total_absent = sum(1 for r in records if r.final_status != "PRESENT")
    total_count = len(records)
    percentage = round((total_present / max(total_count, 1)) * 100.0, 1)

    result_list = []
    for r in records:
        st = r.student
        sess = r.session
        result_list.append({
            "id": r.id,
            "date": sess.start_time.strftime("%Y-%m-%d") if sess else "N/A",
            "time": r.finalized_at.strftime("%I:%M %p") if r.finalized_at else "N/A",
            "student_name": st.name if st else "Unknown",
            "roll_number": st.roll_number if st else "N/A",
            "subject": sess.subject if sess else "N/A",
            "section": sess.section if sess else "N/A",
            "verification_count": f"{r.verified_intervals_count}/{r.total_intervals}",
            "average_confidence": r.average_confidence,
            "liveness": r.liveness_overall,
            "status": r.final_status
        })

    return {
        "summary": {
            "total_records": total_count,
            "present_count": total_present,
            "absent_count": total_absent,
            "present_percentage": percentage
        },
        "records": result_list
    }
