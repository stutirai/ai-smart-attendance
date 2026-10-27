import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import AttendanceSession, AttendanceInterval, AttendanceRecord
from app.schemas.schemas import SessionCreate, SessionResponse, IntervalResponse, AttendanceRecordResponse
from app.services.attendance_service import attendance_service
from app.core.config import settings

router = APIRouter(prefix="/sessions", tags=["Attendance Sessions"])

def format_session_response(s: AttendanceSession, db: Session) -> SessionResponse:
    intervals_db = db.query(AttendanceInterval).filter(AttendanceInterval.session_id == s.id).order_by(AttendanceInterval.interval_index.asc()).all()
    records_db = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == s.id).all()

    intervals = [
        IntervalResponse(
            id=i.id,
            interval_index=i.interval_index,
            status=i.status,
            start_time=i.start_time,
            end_time=i.end_time,
            faces_detected_count=i.faces_detected_count,
            verified_students_count=i.verified_students_count
        ) for i in intervals_db
    ]

    records = []
    for r in records_db:
        st = r.student
        det = {}
        if r.intervals_detail:
            try:
                det = json.loads(r.intervals_detail)
            except Exception:
                det = {}

        records.append(
            AttendanceRecordResponse(
                id=r.id,
                student_id=r.student_id,
                student_name=st.name if st else "Unknown",
                roll_number=st.roll_number if st else "N/A",
                department=st.department if st else "AI & AI/DS",
                verified_intervals_count=r.verified_intervals_count,
                total_intervals=r.total_intervals,
                final_status=r.final_status,
                average_confidence=r.average_confidence,
                liveness_overall=r.liveness_overall,
                intervals_detail=det,
                finalized_at=r.finalized_at
            )
        )

    return SessionResponse(
        id=s.id,
        session_code=s.session_code,
        subject=s.subject,
        section=s.section,
        faculty_name=s.faculty_name,
        duration_minutes=s.duration_minutes,
        is_demo_mode=s.is_demo_mode,
        status=s.status,
        total_intervals=s.total_intervals,
        current_interval=s.current_interval,
        start_time=s.start_time,
        end_time=s.end_time,
        intervals=intervals,
        records=records
    )

@router.post("/start", response_model=SessionResponse)
def start_session(data: SessionCreate, db: Session = Depends(get_db)):
    session = attendance_service.start_session(
        subject=data.subject,
        section=data.section,
        faculty_name=data.faculty_name,
        duration_minutes=data.duration_minutes,
        is_demo_mode=data.is_demo_mode
    )
    return format_session_response(session, db)

@router.post("/stop", response_model=SessionResponse)
def stop_session(db: Session = Depends(get_db)):
    if not attendance_service.active_session_id:
        raise HTTPException(status_code=400, detail="No active session currently running.")

    attendance_service.finalize_attendance()
    session = db.query(AttendanceSession).filter(AttendanceSession.id == attendance_service.active_session_id).first()
    attendance_service.active_session_id = None
    return format_session_response(session, db)

@router.get("/active", response_model=Optional[SessionResponse])
def get_active_session(db: Session = Depends(get_db)):
    if not attendance_service.active_session_id:
        active_db = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
        if active_db:
            return format_session_response(active_db, db)
        return None

    session = db.query(AttendanceSession).filter(AttendanceSession.id == attendance_service.active_session_id).first()
    if not session:
        return None
    return format_session_response(session, db)

@router.get("", response_model=List[SessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(AttendanceSession).order_by(AttendanceSession.start_time.desc()).all()
    return [format_session_response(s, db) for s in sessions]

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return format_session_response(session, db)
