import cv2
import numpy as np
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("attendance.vision.recognizer")

class FaceRecognizer:
    def __init__(self, detector):
        self.detector = detector

    def extract_embedding(self, face) -> Optional[np.ndarray]:
        """
        Extracts 512-dimensional normalized ArcFace embedding from detected face.
        """
        if face is None or face.embedding is None:
            return None
        
        embedding = np.array(face.embedding, dtype=np.float32)
        # Normalize to unit length for cosine similarity via inner product
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding

    def classify_pose(self, yaw: float, pitch: float, roll: float) -> Tuple[str, bool, str]:
        """
        Validates face pose against the 5 enrollment directions:
        1. Frontal face
        2. Yaw approximately -30° (Turn Left)
        3. Yaw approximately +30° (Turn Right)
        4. Pitch approximately +15° (Look Slightly Up)
        5. Pitch approximately -15° (Look Slightly Down)
        """
        if abs(yaw) <= 12 and abs(pitch) <= 10:
            return "FRONTAL", True, "Frontal face detected (Looking Straight)"
        elif -45 <= yaw <= -14:
            return "YAW_LEFT", True, f"Left Turn detected (Yaw: {yaw:.1f}°)"
        elif 14 <= yaw <= 45:
            return "YAW_RIGHT", True, f"Right Turn detected (Yaw: {yaw:.1f}°)"
        elif 9 <= pitch <= 35:
            return "PITCH_UP", True, f"Looking Up detected (Pitch: {pitch:.1f}°)"
        elif -35 <= pitch <= -9:
            return "PITCH_DOWN", True, f"Looking Down detected (Pitch: {pitch:.1f}°)"
        else:
            return "UNCERTAIN", False, f"Adjust angle (Yaw: {yaw:.1f}°, Pitch: {pitch:.1f}°)"

    def crop_and_align_face(self, frame: np.ndarray, face) -> np.ndarray:
        """
        Crops face region with padding for profile preview or sample storage.
        """
        h, w, _ = frame.shape
        x1, y1, x2, y2 = [int(v) for v in face.bbox]
        
        # Add 15% margin
        margin_x = int((x2 - x1) * 0.15)
        margin_y = int((y2 - y1) * 0.15)
        
        x1 = max(0, x1 - margin_x)
        y1 = max(0, y1 - margin_y)
        x2 = min(w, x2 + margin_x)
        y2 = min(h, y2 + margin_y)
        
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return np.zeros((112, 112, 3), dtype=np.uint8)
        return cv2.resize(crop, (112, 112))
