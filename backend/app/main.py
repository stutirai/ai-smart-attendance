import logging
import json
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.models.models import Student, StudentFaceEmbedding
from app.services.faiss_service import faiss_service
from app.services.scheduler_service import scheduler_service
from app.vision.pipeline import vision_pipeline

from app.api.auth import router as auth_router
from app.api.students import router as students_router
from app.api.sessions import router as sessions_router
from app.api.attendance import router as attendance_router
from app.api.vision import router as vision_router
from app.api.reports import router as reports_router
from app.api.evaluation import router as evaluation_router
from app.api.settings_api import router as settings_router
from app.api.ws import router as ws_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("attendance.main")

def seed_demo_students():
    """Pre-seeds the team and sample students from PPT if not present."""
    db = SessionLocal()
    try:
        existing = db.query(Student).first()
        if not existing:
            logger.info("Pre-seeding initial enrolled students...")
            students_data = [
                {
                    "student_id": "G10-060",
                    "name": "Stuti Rai",
                    "roll_number": "2401321630060",
                    "department": "Department of AI / AI&DS",
                    "section": "G10",
                    "email": "stuti.rai@gniot.net.in"
                },
                {
                    "student_id": "G10-054",
                    "name": "Shivani Singh",
                    "roll_number": "2401321630054",
                    "department": "Department of AI / AI&DS",
                    "section": "G10",
                    "email": "shivani.singh@gniot.net.in"
                },
                {
                    "student_id": "G10-015",
                    "name": "Aryan Sharma",
                    "roll_number": "2401321630015",
                    "department": "Department of AI / AI&DS",
                    "section": "G10",
                    "email": "aryan.sharma@gniot.net.in"
                },
                {
                    "student_id": "G10-022",
                    "name": "Ananya Verma",
                    "roll_number": "2401321630022",
                    "department": "Department of AI / AI&DS",
                    "section": "G10",
                    "email": "ananya.verma@gniot.net.in"
                }
            ]

            for s_data in students_data:
                st = Student(
                    student_id=s_data["student_id"],
                    name=s_data["name"],
                    roll_number=s_data["roll_number"],
                    department=s_data["department"],
                    section=s_data["section"],
                    email=s_data["email"],
                    sample_count=5
                )
                db.add(st)
                db.commit()
                db.refresh(st)

                # Generate synthetic normalized 512-D ArcFace seed embeddings for multi-angle samples
                # When enrolling the user via webcam in the UI, real live ArcFace embeddings are captured!
                poses = ["FRONTAL", "YAW_LEFT", "YAW_RIGHT", "PITCH_UP", "PITCH_DOWN"]
                base_vec = np.random.randn(512).astype(np.float32)
                base_vec /= np.linalg.norm(base_vec)

                for pose in poses:
                    # Minor variation for each angle
                    pose_vec = base_vec + np.random.normal(0, 0.05, size=512).astype(np.float32)
                    pose_vec /= np.linalg.norm(pose_vec)

                    faiss_meta = {
                        "student_id": st.id,
                        "student_code": st.student_id,
                        "name": st.name,
                        "roll_number": st.roll_number,
                        "department": st.department,
                        "section": st.section,
                        "pose_type": pose
                    }
                    faiss_id = faiss_service.add_embedding(pose_vec, faiss_meta)

                    emb = StudentFaceEmbedding(
                        student_id=st.id,
                        faiss_id=faiss_id,
                        pose_type=pose,
                        yaw=-25.0 if pose == "YAW_LEFT" else (25.0 if pose == "YAW_RIGHT" else 0.0),
                        pitch=-15.0 if pose == "PITCH_DOWN" else (15.0 if pose == "PITCH_UP" else 0.0),
                        roll=0.0,
                        embedding_data=json.dumps(pose_vec.tolist()),
                        confidence=0.98
                    )
                    db.add(emb)
                db.commit()
            logger.info("Demo students successfully seeded.")
    finally:
        db.close()

# Ensure database tables are created
Base.metadata.create_all(bind=engine)
seed_demo_students()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} backend...")
    vision_pipeline.start()
    scheduler_service.start()
    yield
    # Shutdown
    logger.info("Shutting down backend services...")
    scheduler_service.stop()
    vision_pipeline.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_SUBTITLE,
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(sessions_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(vision_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(evaluation_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "team": settings.PROJECT_GROUP,
        "supervisor": settings.SUPERVISOR,
        "institute": settings.INSTITUTE,
        "status": "ONLINE",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
