import cv2
import time
import base64
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.vision.pipeline import vision_pipeline

router = APIRouter(prefix="/vision", tags=["Vision & Camera"])

class CameraConfigRequest(BaseModel):
    source: str  # "0" or RTSP URL

def generate_video_stream():
    """Generator yielding MJPEG multipart frames for HTML <img> video stream."""
    while True:
        frame, _ = vision_pipeline.process_current_frame()
        if frame is None:
            time.sleep(0.04)
            continue

        ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ret:
            time.sleep(0.02)
            continue

        frame_bytes = buffer.tobytes()
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )
        time.sleep(0.033)  # Cap at ~30 FPS

@router.get("/stream")
def video_stream():
    """Direct video stream endpoint usable in <img src='/api/vision/stream' />"""
    return StreamingResponse(
        generate_video_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/capture-frame")
def capture_single_frame():
    """Captures a single raw frame with pose classification for the enrollment UI."""
    raw = vision_pipeline.camera.get_frame()
    if raw is None:
        raise HTTPException(status_code=503, detail="Camera frame unavailable.")

    # Detect face and pose
    faces = vision_pipeline.detector.detect_faces(raw)
    pose_info = None
    if len(faces) == 1:
        face = faces[0]
        yaw, pitch, roll = vision_pipeline.detector.extract_landmarks_and_pose(face)
        pose_type, is_valid, msg = vision_pipeline.recognizer.classify_pose(yaw, pitch, roll)
        pose_info = {
            "pose_type": pose_type,
            "yaw": round(yaw, 1),
            "pitch": round(pitch, 1),
            "roll": round(roll, 1),
            "is_valid": is_valid,
            "message": msg
        }

    ret, buffer = cv2.imencode(".jpg", raw, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64_str = base64.b64encode(buffer).decode("utf-8")

    return {
        "image_base64": f"data:image/jpeg;base64,{b64_str}",
        "faces_detected": len(faces),
        "pose_info": pose_info
    }

@router.post("/camera-source")
def update_camera_source(req: CameraConfigRequest):
    vision_pipeline.camera.stop()
    vision_pipeline.camera.source = req.source
    vision_pipeline.camera.start()
    return {"status": "SUCCESS", "camera_source": req.source}
