from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), default="AI & AI/DS")
    section = Column(String(20), default="A")
    email = Column(String(100), nullable=True)
    sample_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    embeddings = relationship("StudentFaceEmbedding", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    observations = relationship("AttendanceObservation", back_populates="student")

class StudentFaceEmbedding(Base):
    __tablename__ = "student_face_embeddings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    faiss_id = Column(Integer, nullable=True, index=True)
    pose_type = Column(String(50), default="FRONTAL")  # FRONTAL, YAW_LEFT, YAW_RIGHT, PITCH_UP, PITCH_DOWN
    yaw = Column(Float, default=0.0)
    pitch = Column(Float, default=0.0)
    roll = Column(Float, default=0.0)
    embedding_data = Column(Text, nullable=False)  # JSON-serialized 512-D float list
    confidence = Column(Float, default=1.0)
    image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="embeddings")

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)
    subject = Column(String(100), nullable=False, default="Artificial Intelligence")
    section = Column(String(20), nullable=False, default="G10")
    faculty_name = Column(String(100), default="Ms. Swati Singh")
    duration_minutes = Column(Integer, default=50)
    is_demo_mode = Column(Boolean, default=True)
    status = Column(String(30), default="SCHEDULED")  # SCHEDULED, ACTIVE, COMPLETED, CANCELLED
    total_intervals = Column(Integer, default=5)
    current_interval = Column(Integer, default=0)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    intervals = relationship("AttendanceInterval", back_populates="session", cascade="all, delete-orphan")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")
    observations = relationship("AttendanceObservation", back_populates="session", cascade="all, delete-orphan")

class AttendanceInterval(Base):
    __tablename__ = "attendance_intervals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    interval_index = Column(Integer, nullable=False)  # 1, 2, 3, 4, 5
    status = Column(String(30), default="PENDING")  # PENDING, BURST_ACTIVE, COMPLETED
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    faces_detected_count = Column(Integer, default=0)
    verified_students_count = Column(Integer, default=0)

    session = relationship("AttendanceSession", back_populates="intervals")
    observations = relationship("AttendanceObservation", back_populates="interval", cascade="all, delete-orphan")

class AttendanceObservation(Base):
    __tablename__ = "attendance_observations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    interval_id = Column(Integer, ForeignKey("attendance_intervals.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    confidence = Column(Float, nullable=False)
    liveness_status = Column(String(30), default="LIVE")  # LIVE, LIVENESS_FAILED, UNVERIFIED
    liveness_score = Column(Float, default=1.0)
    frame_timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("AttendanceSession", back_populates="observations")
    interval = relationship("AttendanceInterval", back_populates="observations")
    student = relationship("Student", back_populates="observations")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    verified_intervals_count = Column(Integer, default=0)
    total_intervals = Column(Integer, default=5)
    # Core Attendance Rule: >= 3 out of 5 -> PRESENT, else NOT_VERIFIED
    final_status = Column(String(30), default="NOT_VERIFIED")  # PRESENT, NOT_VERIFIED, ABSENT
    average_confidence = Column(Float, default=0.0)
    liveness_overall = Column(String(30), default="PASS")  # PASS, FAIL
    intervals_detail = Column(Text, default="{}")  # JSON: {"1": true, "2": true, "3": true, "4": false, "5": true}
    finalized_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
