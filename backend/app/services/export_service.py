import csv
import io
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import AttendanceRecord, AttendanceSession, Student

class ExportService:
    @staticmethod
    def generate_session_csv(db: Session, session_id: int) -> str:
        session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
        if not session:
            return ""

        output = io.StringIO()
        writer = csv.writer(output)

        # Header metadata
        writer.writerow(["AI-Based Smart Attendance Monitoring System"])
        writer.writerow(["Department of AI & AI/DS, GNIOT Greater Noida"])
        writer.writerow(["Session Code", session.session_code])
        writer.writerow(["Subject", session.subject])
        writer.writerow(["Section", session.section])
        writer.writerow(["Faculty", session.faculty_name])
        writer.writerow(["Date", session.start_time.strftime("%Y-%m-%d")])
        writer.writerow(["Start Time", session.start_time.strftime("%I:%M %p")])
        writer.writerow([])

        # Table Header
        writer.writerow([
            "Student Name",
            "Roll Number",
            "Student ID",
            "Subject",
            "Verification Count",
            "Average Confidence",
            "Liveness Result",
            "Final Status",
            "Time Finalized"
        ])

        records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
        for rec in records:
            student = rec.student
            writer.writerow([
                student.name if student else "Unknown",
                student.roll_number if student else "N/A",
                student.student_id if student else "N/A",
                session.subject,
                f"{rec.verified_intervals_count}/{rec.total_intervals}",
                f"{rec.average_confidence:.2f}",
                rec.liveness_overall,
                rec.final_status,
                rec.finalized_at.strftime("%I:%M %p") if rec.finalized_at else "N/A"
            ])

        return output.getvalue()

    @staticmethod
    def generate_all_history_csv(db: Session) -> str:
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["AI-Based Smart Attendance Monitoring System - Complete Attendance Log"])
        writer.writerow(["Generated At", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow([])
        writer.writerow([
            "Date",
            "Session Code",
            "Subject",
            "Section",
            "Student Name",
            "Roll Number",
            "Verification Count",
            "Average Confidence",
            "Liveness",
            "Final Status",
            "Finalized Time"
        ])

        records = db.query(AttendanceRecord).join(AttendanceSession).order_by(AttendanceRecord.finalized_at.desc()).all()
        for rec in records:
            student = rec.student
            session = rec.session
            writer.writerow([
                session.start_time.strftime("%Y-%m-%d") if session else "N/A",
                session.session_code if session else "N/A",
                session.subject if session else "N/A",
                session.section if session else "N/A",
                student.name if student else "Unknown",
                student.roll_number if student else "N/A",
                f"{rec.verified_intervals_count}/{rec.total_intervals}",
                f"{rec.average_confidence:.2f}",
                rec.liveness_overall,
                rec.final_status,
                rec.finalized_at.strftime("%I:%M %p") if rec.finalized_at else "N/A"
            ])

        return output.getvalue()
