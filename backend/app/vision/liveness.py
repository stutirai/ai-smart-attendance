import cv2
import numpy as np
import time
from typing import Dict, Tuple, List, Optional
from collections import deque

class PrototypeLivenessDetector:
    """
    Prototype Liveness Verification:
    Uses multi-frame temporal analysis, landmark micro-motion, and eye aspect variance
    to distinguish live students from static 2D printed photographs or frozen smartphone displays.
    """
    def __init__(self, history_len: int = 15):
        self.history_len = history_len
        # Key: face identifier (identity or track box key), Value: history deque of landmark crops/kps
        self.track_history: Dict[str, deque] = {}
        self.last_cleanup = time.time()

    def _cleanup_stale_tracks(self):
        now = time.time()
        if now - self.last_cleanup > 30.0:
            self.track_history.clear()
            self.last_cleanup = now

    def evaluate_liveness(self, track_id: str, face, frame: np.ndarray) -> Tuple[bool, float, str]:
        self._cleanup_stale_tracks()

        if face is None or face.bbox is None:
            return True, 1.0, "LIVE"

        x1, y1, x2, y2 = [int(v) for v in face.bbox]
        h, w, _ = frame.shape
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        if x2 - x1 < 20 or y2 - y1 < 20:
            return True, 0.85, "LIVE (Small Face)"

        face_roi = frame[y1:y2, x1:x2]
        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        gray_thumb = cv2.resize(gray_roi, (48, 48))

        kps = face.kps if hasattr(face, "kps") and face.kps is not None else None

        if track_id not in self.track_history:
            self.track_history[track_id] = deque(maxlen=self.history_len)

        history = self.track_history[track_id]
        history.append({
            "timestamp": time.time(),
            "thumb": gray_thumb,
            "kps": kps.copy() if kps is not None else None
        })

        # Need at least 5 frames to assess natural temporal dynamics
        if len(history) < 5:
            return True, 0.95, "LIVE"

        # 1. Calculate frame-to-frame pixel differences across the history
        diffs = []
        for i in range(1, len(history)):
            diff = cv2.absdiff(history[i]["thumb"], history[i-1]["thumb"])
            diffs.append(float(np.mean(diff)))

        mean_diff = float(np.mean(diffs))
        std_diff = float(np.std(diffs))

        # 2. Check landmark variance (if kps available)
        landmark_motion = 0.0
        if kps is not None and all(h["kps"] is not None for h in history):
            # Compute eye distance variance
            eye_dists = []
            for h in history:
                eye_dist = np.linalg.norm(h["kps"][1] - h["kps"][0])
                eye_dists.append(eye_dist)
            landmark_motion = float(np.std(eye_dists))

        # A completely rigid static photo presented to the camera has near-zero micro-motion
        # whereas a live face has subtle facial tremor, pulse, blinks, and eye saccades
        if mean_diff < 0.25 and landmark_motion < 0.05:
            # Presentation attack suspected (static printout / motionless screen)
            liveness_score = round(max(0.1, mean_diff / 2.0), 2)
            return False, liveness_score, "LIVENESS FAILED"
        
        # Normal live human micro-dynamics
        liveness_score = round(min(0.99, 0.80 + (mean_diff / 20.0)), 2)
        return True, liveness_score, "LIVE"
