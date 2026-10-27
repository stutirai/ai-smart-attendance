import cv2
import json
import base64
import numpy as np
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.models import Student, StudentFaceEmbedding
from app.schemas.schemas import StudentCreate, StudentResponse, EnrollmentCompleteResponse
from app.vision.pipeline import vision_pipeline
from app.services.faiss_service import faiss_service

logger = logging.getLogger("attendance.api.students")
router = APIRouter(prefix="/students", tags=["Students & Enrollment"])

class SampleCaptureRequest(BaseModel):
    image_base64: Optional[str] = None  # If None, capture from live camera stream
    target_pose: Optional[str] = None   # FRONTAL, YAW_LEFT, YAW_RIGHT, PITCH_UP, PITCH_DOWN

class PoseCheckResponse(BaseModel):
    success: bool
    pose_type: str
    yaw: float
    pitch: float
    roll: float
    message: str
    sample_count: int

@router.get("", response_model=List[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id.desc()).all()
    return students

@router.post("", response_model=StudentResponse)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(
        (Student.roll_number == data.roll_number) | (Student.student_id == data.student_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with Roll Number {data.roll_number} or ID {data.student_id} already exists."
        )

    student = Student(
        student_id=data.student_id,
        name=data.name,
        roll_number=data.roll_number,
        department=data.department,
        section=data.section,
        email=data.email,
        sample_count=0
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student

@router.post("/{student_id}/samples", response_model=PoseCheckResponse)
def capture_face_sample(student_id: int, req: SampleCaptureRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Acquire image either from base64 upload or live webcam
    if req.image_base64:
        try:
            img_data = base64.b64decode(req.image_base64.split(",")[-1])
            np_arr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {e}")
    else:
        frame = vision_pipeline.camera.get_frame()
        if frame is None:
            raise HTTPException(status_code=503, detail="Camera stream unavailable to capture sample.")

    # Detect face
    faces = vision_pipeline.detector.detect_faces(frame)
    if len(faces) == 0:
        return PoseCheckResponse(
            success=False,
            pose_type="NONE",
            yaw=0.0, pitch=0.0, roll=0.0,
            message="No face detected. Please position face clearly in the camera frame.",
            sample_count=student.sample_count
        )

    if len(faces) > 1:
        return PoseCheckResponse(
            success=False,
            pose_type="MULTIPLE",
            yaw=0.0, pitch=0.0, roll=0.0,
            message="Multiple faces detected. Please ensure only the student being enrolled is in frame.",
            sample_count=student.sample_count
        )

    target_face = faces[0]
    yaw, pitch, roll = vision_pipeline.detector.extract_landmarks_and_pose(target_face)
    pose_type, is_valid_angle, pose_msg = vision_pipeline.recognizer.classify_pose(yaw, pitch, roll)

    # Extract 512-D ArcFace embedding
    embedding = vision_pipeline.recognizer.extract_embedding(target_face)
    if embedding is None:
        raise HTTPException(status_code=500, detail="Failed to extract ArcFace facial embedding.")

    # Register in FAISS Index
    faiss_metadata = {
        "student_id": student.id,
        "student_code": student.student_id,
        "name": student.name,
        "roll_number": student.roll_number,
        "department": student.department,
        "section": student.section,
        "pose_type": pose_type
    }
    faiss_id = faiss_service.add_embedding(embedding, faiss_metadata)

    # Save to database
    db_embedding = StudentFaceEmbedding(
        student_id=student.id,
        faiss_id=faiss_id,
        pose_type=pose_type,
        yaw=float(yaw),
        pitch=float(pitch),
        roll=float(roll),
        embedding_data=json.dumps(embedding.tolist()),
        confidence=float(target_face.det_score) if hasattr(target_face, "det_score") else 1.0
    )
    db.add(db_embedding)

    student.sample_count += 1
    db.commit()

    return PoseCheckResponse(
        success=True,
        pose_type=pose_type,
        yaw=round(yaw, 1),
        pitch=round(pitch, 1),
        roll=round(roll, 1),
        message=f"Sample registered successfully: {pose_msg}",
        sample_count=student.sample_count
    )

@router.get("/{student_id}/enrollment-summary", response_model=EnrollmentCompleteResponse)
def get_enrollment_summary(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return EnrollmentCompleteResponse(
        status="Registered",
        student_name=student.name,
        roll_number=student.roll_number,
        student_id=student.student_id,
        samples_collected=student.sample_count,
        embedding_dimension=512,
        model="InsightFace ArcFace",
        faiss_index_status=f"Active ({faiss_service.index.ntotal} total vectors indexed)"
    )

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return {"message": f"Student {student.name} deleted successfully."}
