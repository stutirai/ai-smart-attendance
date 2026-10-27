import time
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from collections import defaultdict

from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import (
    Student,
    AttendanceSession,
    AttendanceInterval,
    AttendanceObservation,
    AttendanceRecord
)
from app.database.connection import SessionLocal

logger = logging.getLogger("attendance.services.attendance")

class AttendanceService:
    def __init__(self):
        # In-memory tracking for the active session
        self.active_session_id: Optional[int] = None
        self.current_interval_index: int = 0
        self.is_burst_active: bool = False
        self.burst_start_time: float = 0.0
        self.burst_duration: float = float(settings.DEMO_BURST_DURATION if settings.IS_DEMO_MODE else settings.REAL_BURST_DURATION)
        self.interval_duration: float = float(settings.DEMO_INTERVAL_DURATION if settings.IS_DEMO_MODE else settings.REAL_INTERVAL_DURATION)
        self.next_interval_time: float = 0.0

        # Observations accumulated during the current active burst window:
        # student_id -> list of observation dicts: [{"confidence": float, "liveness": str, "timestamp": float}]
        self.current_burst_observations: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
        
        # Interval verification results matrix for active session:
        # student_id -> dict { 1: bool, 2: bool, 3: bool, 4: bool, 5: bool }
        self.student_interval_verifications: Dict[int, Dict[int, bool]] = defaultdict(lambda: {i: False for i in range(1, 6)})
        
        # Summary telemetry
        self.current_frame_faces: List[Dict[str, Any]] = []
        self.last_matching_latency_ms: float = 0.0

    def start_session(
        self, 
        subject: str, 
        section: str, 
        faculty_name: str, 
        duration_minutes: int, 
        is_demo_mode: bool
    ) -> AttendanceSession:
        db: Session = SessionLocal()
        try:
            # End any existing active sessions
            active_sessions = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").all()
            for s in active_sessions:
                s.status = "COMPLETED"
                s.end_time = datetime.utcnow()
            db.commit()

            # Create new session
            session_code = f"ATT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
            session = AttendanceSession(
                session_code=session_code,
                subject=subject,
                section=section,
                faculty_name=faculty_name,
                duration_minutes=duration_minutes,
                is_demo_mode=is_demo_mode,
                status="ACTIVE",
                total_intervals=settings.TOTAL_INTERVALS,
                current_interval=0,
                start_time=datetime.utcnow()
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            # Pre-create the 5 intervals
            for i in range(1, settings.TOTAL_INTERVALS + 1):
                interval = AttendanceInterval(
                    session_id=session.id,
                    interval_index=i,
                    status="PENDING"
                )
                db.add(interval)
            db.commit()

            # Initialize in-memory state
            self.active_session_id = session.id
            self.current_interval_index = 0
            self.is_burst_active = False
            self.burst_start_time = 0.0
            self.burst_duration = float(settings.DEMO_BURST_DURATION if is_demo_mode else settings.REAL_BURST_DURATION)
            self.interval_duration = float(settings.DEMO_INTERVAL_DURATION if is_demo_mode else settings.REAL_INTERVAL_DURATION)
            self.next_interval_time = time.time() + 2.0  # Start first interval shortly after launch
            self.current_burst_observations.clear()
            self.student_interval_verifications.clear()

            # Initialize verification matrix for all registered students
            students = db.query(Student).all()
            for st in students:
                self.student_interval_verifications[st.id] = {i: False for i in range(1, settings.TOTAL_INTERVALS + 1)}

            logger.info(f"Started Attendance Session {session.session_code} (Demo Mode: {is_demo_mode})")
            return session
        finally:
            db.close()

    def start_interval_burst(self, interval_index: int):
        """
        Triggers a new temporal verification burst window (e.g. 30s real / 5s demo).
        """
        if not self.active_session_id:
            return

        db: Session = SessionLocal()
        try:
            self.current_interval_index = interval_index
            self.is_burst_active = True
            self.burst_start_time = time.time()
            self.current_burst_observations.clear()

            # Update interval status in database
            interval = db.query(AttendanceInterval).filter(
                AttendanceInterval.session_id == self.active_session_id,
                AttendanceInterval.interval_index == interval_index
            ).first()

            if interval:
                interval.status = "BURST_ACTIVE"
                interval.start_time = datetime.utcnow()
                db.commit()

            # Update session current interval
            session = db.query(AttendanceSession).filter(AttendanceSession.id == self.active_session_id).first()
            if session:
                session.current_interval = interval_index
                db.commit()

            logger.info(f"Started Verification Burst for Interval {interval_index}/5 (Duration: {self.burst_duration}s)")
        finally:
            db.close()

    def record_burst_observation(self, student_id: int, confidence: float, liveness_status: str, liveness_score: float):
        """
        Collects high-frequency face observations during an active burst.
        Tolerates temporary occlusion, turning, and looking down across frames.
        """
        if not self.is_burst_active or not self.active_session_id:
            return

        self.current_burst_observations[student_id].append({
            "confidence": confidence,
            "liveness_status": liveness_status,
            "liveness_score": liveness_score,
            "timestamp": time.time()
        })

    def complete_interval_burst(self):
        """
        Aggregates observations collected during the burst window.
        Determines whether each student passed this interval based on:
        - Consistent appearance across burst frames (>= MIN_BURST_DETECTIONS)
        - Confidence threshold
        - Liveness verification
        """
        if not self.active_session_id or not self.is_burst_active:
            return

        db: Session = SessionLocal()
        try:
            self.is_burst_active = False
            interval_idx = self.current_interval_index
            verified_count = 0

            interval = db.query(AttendanceInterval).filter(
                AttendanceInterval.session_id == self.active_session_id,
                AttendanceInterval.interval_index == interval_idx
            ).first()

            # Evaluate each student with observations during this burst
            for student_id, obs_list in self.current_burst_observations.items():
                if len(obs_list) >= settings.MIN_BURST_DETECTIONS:
                    avg_conf = sum(o["confidence"] for o in obs_list) / len(obs_list)
                    live_passes = sum(1 for o in obs_list if o["liveness_status"] == "LIVE")
                    
                    # Liveness check passed if majority of burst observations were LIVE
                    liveness_passed = (live_passes >= (len(obs_list) * 0.5))

                    if avg_conf >= settings.RECOGNITION_THRESHOLD and liveness_passed:
                        self.student_interval_verifications[student_id][interval_idx] = True
                        verified_count += 1

                        # Store DB observation record
                        obs_record = AttendanceObservation(
                            session_id=self.active_session_id,
                            interval_id=interval.id if interval else 0,
                            student_id=student_id,
                            confidence=float(avg_conf),
                            liveness_status="LIVE" if liveness_passed else "FAILED",
                            liveness_score=1.0 if liveness_passed else 0.0,
                            frame_timestamp=datetime.utcnow()
                        )
                        db.add(obs_record)

            if interval:
                interval.status = "COMPLETED"
                interval.end_time = datetime.utcnow()
                interval.verified_students_count = verified_count
                db.commit()

            logger.info(f"Interval {interval_idx}/5 Completed. Verified Students in this burst: {verified_count}")

            # Check if this was the final interval (5/5)
            if interval_idx >= settings.TOTAL_INTERVALS:
                self.finalize_attendance()
            else:
                self.next_interval_time = time.time() + self.interval_duration
        finally:
            db.close()

    def finalize_attendance(self):
        """
        CORE ATTENDANCE RULE (Slide 6 & Slide 7):
        Verified in >= 3 out of 5 intervals -> PRESENT
        Verified in < 3 out of 5 intervals  -> NOT VERIFIED / ABSENT
        Ensures strict DUPLICATE PREVENTION: Exactly 1 record per student per session!
        """
        if not self.active_session_id:
            return

        db: Session = SessionLocal()
        try:
            session = db.query(AttendanceSession).filter(AttendanceSession.id == self.active_session_id).first()
            if not session:
                return

            session.status = "COMPLETED"
            session.end_time = datetime.utcnow()

            students = db.query(Student).all()
            for st in students:
                # Existing record check to prevent duplicates
                existing_rec = db.query(AttendanceRecord).filter(
                    AttendanceRecord.session_id == self.active_session_id,
                    AttendanceRecord.student_id == st.id
                ).first()

                verif_dict = self.student_interval_verifications.get(st.id, {i: False for i in range(1, 6)})
                verified_count = sum(1 for v in verif_dict.values() if v)

                # Core Decision Rule
                if verified_count >= settings.REQUIRED_VERIFIED_INTERVALS:
                    final_status = "PRESENT"
                else:
                    final_status = "NOT_VERIFIED"

                # Calculate avg confidence from observations
                obs = db.query(AttendanceObservation).filter(
                    AttendanceObservation.session_id == self.active_session_id,
                    AttendanceObservation.student_id == st.id
                ).all()
                avg_conf = sum(o.confidence for o in obs) / len(obs) if obs else 0.0

                if existing_rec:
                    existing_rec.verified_intervals_count = verified_count
                    existing_rec.final_status = final_status
                    existing_rec.average_confidence = float(round(avg_conf, 2))
                    existing_rec.intervals_detail = json.dumps(verif_dict)
                    existing_rec.finalized_at = datetime.utcnow()
                else:
                    rec = AttendanceRecord(
                        session_id=self.active_session_id,
                        student_id=st.id,
                        verified_intervals_count=verified_count,
                        total_intervals=settings.TOTAL_INTERVALS,
                        final_status=final_status,
                        average_confidence=float(round(avg_conf, 2)),
                        liveness_overall="PASS" if final_status == "PRESENT" else "FAIL",
                        intervals_detail=json.dumps(verif_dict),
                        finalized_at=datetime.utcnow()
                    )
                    db.add(rec)

            db.commit()
            logger.info(f"Attendance finalized for Session {session.session_code}.")
        finally:
            db.close()

    def get_live_stats(self) -> Dict[str, Any]:
        """Returns real-time operational metrics for WebSocket and UI."""
        burst_rem = 0.0
        if self.is_burst_active:
            elapsed = time.time() - self.burst_start_time
            burst_rem = max(0.0, round(self.burst_duration - elapsed, 1))

        next_in = 0.0
        if not self.is_burst_active and self.current_interval_index < settings.TOTAL_INTERVALS and self.next_interval_time > 0:
            next_in = max(0.0, round(self.next_interval_time - time.time(), 1))

        # Verified student IDs in current session
        verified_student_names = []
        db: Session = SessionLocal()
        try:
            for s_id, v_dict in self.student_interval_verifications.items():
                if any(v_dict.values()):
                    student = db.query(Student).filter(Student.id == s_id).first()
                    if student:
                        v_cnt = sum(1 for v in v_dict.values() if v)
                        verified_student_names.append(f"{student.name} ({v_cnt}/5)")
        finally:
            db.close()

        recognized_count = sum(1 for f in self.current_frame_faces if f.get("is_known", False))
        unknown_count = sum(1 for f in self.current_frame_faces if not f.get("is_known", False))

        return {
            "session_id": self.active_session_id,
            "session_status": "ACTIVE" if self.active_session_id and self.current_interval_index <= settings.TOTAL_INTERVALS else "IDLE",
            "current_interval": self.current_interval_index,
            "total_intervals": settings.TOTAL_INTERVALS,
            "is_burst_active": self.is_burst_active,
            "burst_remaining_seconds": burst_rem,
            "next_interval_in_seconds": next_in,
            "is_demo_mode": settings.IS_DEMO_MODE,
            "faces_detected": len(self.current_frame_faces),
            "recognized_count": recognized_count,
            "unknown_count": unknown_count,
            "average_matching_latency_ms": self.last_matching_latency_ms,
            "active_students_verified": verified_student_names,
            "student_intervals": {
                str(k): v for k, v in self.student_interval_verifications.items()
            }
        }

attendance_service = AttendanceService()
