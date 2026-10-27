from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Student Schemas ---
class StudentBase(BaseModel):
    student_id: str
    name: str
    roll_number: str
    department: str = "AI & AI/DS"
    section: str = "G10"
    email: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    sample_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Enrollment Schemas ---
class SamplePoseFeedback(BaseModel):
    pose_type: str  # FRONTAL, YAW_LEFT, YAW_RIGHT, PITCH_UP, PITCH_DOWN
    yaw: float
    pitch: float
    roll: float
    is_valid_angle: bool
    message: str

class EnrollmentCompleteResponse(BaseModel):
    status: str
    student_name: str
    roll_number: str
    student_id: str
    samples_collected: int
    embedding_dimension: int = 512
    model: str = "InsightFace ArcFace"
    faiss_index_status: str

# --- Session Schemas ---
class SessionCreate(BaseModel):
    subject: str = "Artificial Intelligence"
    section: str = "G10"
    faculty_name: str = "Ms. Swati Singh"
    duration_minutes: int = 50
    is_demo_mode: bool = True

class IntervalResponse(BaseModel):
    id: int
    interval_index: int
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    faces_detected_count: int = 0
    verified_students_count: int = 0

    class Config:
        from_attributes = True

class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    roll_number: str
    department: str
    verified_intervals_count: int
    total_intervals: int
    final_status: str  # PRESENT or NOT_VERIFIED
    average_confidence: float
    liveness_overall: str
    intervals_detail: Dict[str, bool]
    finalized_at: datetime

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: int
    session_code: str
    subject: str
    section: str
    faculty_name: str
    duration_minutes: int
    is_demo_mode: bool
    status: str
    total_intervals: int
    current_interval: int
    start_time: datetime
    end_time: Optional[datetime] = None
    intervals: List[IntervalResponse] = []
    records: List[AttendanceRecordResponse] = []

    class Config:
        from_attributes = True

# --- Live Detections & System Stats ---
class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class DetectedFace(BaseModel):
    box: BoundingBox
    identity: str
    student_id: Optional[str] = None
    roll_number: Optional[str] = None
    confidence: float
    is_known: bool
    liveness_status: str
    liveness_score: float
    yaw: float = 0.0
    pitch: float = 0.0

class LiveSystemStats(BaseModel):
    session_id: Optional[int] = None
    session_status: str = "IDLE"
    current_interval: int = 0
    total_intervals: int = 5
    is_burst_active: bool = False
    burst_remaining_seconds: float = 0.0
    next_interval_in_seconds: float = 0.0
    is_demo_mode: bool = True
    camera_connected: bool = False
    fps: float = 0.0
    faces_detected: int = 0
    recognized_count: int = 0
    unknown_count: int = 0
    average_matching_latency_ms: float = 0.0
    active_students_verified: List[str] = []

# --- System Settings Schema ---
class SystemSettingsModel(BaseModel):
    recognition_threshold: float
    total_intervals: int
    required_verified_intervals: int
    is_demo_mode: bool
    demo_burst_duration: int
    demo_interval_duration: int
    real_burst_duration: int
    real_interval_duration: int
    enable_liveness: bool
    camera_source: str
