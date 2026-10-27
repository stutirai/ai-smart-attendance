from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.models import AttendanceRecord, AttendanceSession, Student
from app.services.export_service import ExportService

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/session/{session_id}/csv")
def export_session_csv(session_id: int, db: Session = Depends(get_db)):
    csv_content = ExportService.generate_session_csv(db, session_id)
    if not csv_content:
        raise HTTPException(status_code=404, detail="Session not found or empty.")

    filename = f"attendance_session_{session_id}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/all/csv")
def export_all_csv(db: Session = Depends(get_db)):
    csv_content = ExportService.generate_all_history_csv(db)
    filename = "complete_attendance_history.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/analytics")
def get_student_analytics(db: Session = Depends(get_db)):
    """
    Computes per-student attendance analytics:
    Total classes, Present, Absent, Attendance percentage.
    """
    students = db.query(Student).all()
    results = []

    for st in students:
        records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == st.id).all()
        total_classes = len(records)
        present = sum(1 for r in records if r.final_status == "PRESENT")
        absent = total_classes - present
        percentage = round((present / max(total_classes, 1)) * 100.0, 1) if total_classes > 0 else 0.0

        results.append({
            "student_id": st.id,
            "student_code": st.student_id,
            "name": st.name,
            "roll_number": st.roll_number,
            "department": st.department,
            "section": st.section,
            "total_classes": total_classes,
            "present_count": present,
            "absent_count": absent,
            "attendance_percentage": percentage
        })

    return results
