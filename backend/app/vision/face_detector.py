import cv2
import numpy as np
import logging
from typing import List, Dict, Any, Tuple
import insightface

logger = logging.getLogger("attendance.vision.detector")

class FaceDetector:
    def __init__(self):
        logger.info("Initializing InsightFace SCRFD Dense Face Detector...")
        try:
            self.app = insightface.app.FaceAnalysis(
                name="buffalo_s",
                providers=["CPUExecutionProvider"]
            )
            self.app.prepare(ctx_id=-1, det_size=(640, 640))
            logger.info("Face detector successfully loaded.")
        except Exception as e:
            logger.error(f"Error loading InsightFace model: {e}")
            raise e

    def detect_faces(self, frame: np.ndarray) -> List[Any]:
        """
        Detects all visible faces in a frame.
        Supports dense classroom face detection (front-row to backbenchers).
        Returns list of InsightFace Face objects with bbox, kps, embedding, etc.
        """
        if frame is None or frame.size == 0:
            return []
        
        # InsightFace expects BGR format (native OpenCV format)
        faces = self.app.get(frame)
        return faces

    def extract_landmarks_and_pose(self, face) -> Tuple[float, float, float]:
        """
        Calculates approximate Yaw, Pitch, Roll from 5-point or 68-point landmarks.
        InsightFace kps: [left_eye, right_eye, nose, left_mouth, right_mouth]
        """
        if face.kps is None or len(face.kps) < 5:
            return 0.0, 0.0, 0.0

        kps = face.kps
        left_eye = kps[0]
        right_eye = kps[1]
        nose = kps[2]
        left_mouth = kps[3]
        right_mouth = kps[4]

        # Roll: eye tilt angle
        dx = right_eye[0] - left_eye[0]
        dy = right_eye[1] - left_eye[1]
        roll = np.degrees(np.arctan2(dy, dx))

        # Yaw: nose horizontal symmetry relative to eye midpoint
        eye_midpoint_x = (left_eye[0] + right_eye[0]) / 2.0
        eye_dist = max(np.linalg.norm(right_eye - left_eye), 1e-6)
        yaw = float(((nose[0] - eye_midpoint_x) / eye_dist) * 90.0)

        # Pitch: nose vertical position relative to eye-mouth vertical midpoint
        eye_midpoint_y = (left_eye[1] + right_eye[1]) / 2.0
        mouth_midpoint_y = (left_mouth[1] + right_mouth[1]) / 2.0
        face_height = max(abs(mouth_midpoint_y - eye_midpoint_y), 1e-6)
        expected_nose_y = eye_midpoint_y + 0.4 * face_height
        pitch = float(((nose[1] - expected_nose_y) / face_height) * 60.0)

        # Clamp values
        yaw = float(np.clip(yaw, -90.0, 90.0))
        pitch = float(np.clip(pitch, -90.0, 90.0))
        roll = float(np.clip(roll, -90.0, 90.0))

        return yaw, pitch, roll
