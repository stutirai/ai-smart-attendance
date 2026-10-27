import os
from pathlib import Path
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

DATA_DIR.mkdir(exist_ok=True, parents=True)
(DATA_DIR / "embeddings").mkdir(exist_ok=True, parents=True)
(DATA_DIR / "students").mkdir(exist_ok=True, parents=True)
MODELS_DIR.mkdir(exist_ok=True, parents=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Smart Attendance Monitoring System"
    PROJECT_SUBTITLE: str = "Zero-Interference Classroom Attendance via Periodic Temporal Face Verification"
    PROJECT_GROUP: str = "Group G10 (Shivani Singh & Stuti Rai)"
    INSTITUTE: str = "Greater Noida Institute of Technology (GNIOT)"
    SUPERVISOR: str = "Ms. Swati Singh"

    API_V1_STR: str = "/api"
    SECRET_KEY: str = "smart-attendance-g10-secret-key-2026"
    
    # Database (supports PostgreSQL; falls back to SQLite seamlessly)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DATA_DIR / 'attendance.db'}"
    )

    # Face Recognition & FAISS
    EMBEDDING_DIM: int = 512
    RECOGNITION_THRESHOLD: float = 0.55  # Cosine similarity threshold
    FAISS_INDEX_PATH: str = str(DATA_DIR / "embeddings" / "face_index.faiss")
    FAISS_MAPPING_PATH: str = str(DATA_DIR / "embeddings" / "index_mapping.json")

    # Temporal Verification Rules (Slide 6 & Slide 7)
    TOTAL_INTERVALS: int = 5
    REQUIRED_VERIFIED_INTERVALS: int = 3  # Core rule: >= 3 out of 5 intervals -> PRESENT
    MIN_BURST_DETECTIONS: int = 3  # Minimum frame verifications in a burst window

    # Timing: Real Mode vs Demo Mode
    IS_DEMO_MODE: bool = True  # Default to demo mode for quick college demonstration
    
    # Real Mode Timings (seconds)
    REAL_BURST_DURATION: int = 30
    REAL_INTERVAL_DURATION: int = 600  # 10 minutes
    
    # Demo Mode Timings (seconds)
    DEMO_BURST_DURATION: int = 5
    DEMO_INTERVAL_DURATION: int = 15  # 15 seconds per interval

    # Liveness (Anti-Proxy)
    ENABLE_LIVENESS: bool = True
    EAR_THRESHOLD: float = 0.22  # Eye Aspect Ratio threshold for blink detection
    MOTION_THRESHOLD: float = 1.8  # Inter-frame motion threshold to reject static photos

    # Camera
    CAMERA_SOURCE: str = "0"  # "0" for webcam, or RTSP URL e.g. "rtsp://..."

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
