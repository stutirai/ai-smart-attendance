import cv2
import time
import numpy as np
import logging
from typing import Dict, Any, List, Tuple, Optional

from app.vision.camera import CameraStream
from app.vision.face_detector import FaceDetector
from app.vision.face_recognizer import FaceRecognizer
from app.vision.liveness import PrototypeLivenessDetector
from app.services.faiss_service import faiss_service
from app.services.attendance_service import attendance_service
from app.core.config import settings

logger = logging.getLogger("attendance.vision.pipeline")

class VisionPipeline:
    def __init__(self):
        self.camera = CameraStream(source=settings.CAMERA_SOURCE)
        self.detector = FaceDetector()
        self.recognizer = FaceRecognizer(self.detector)
        self.liveness = PrototypeLivenessDetector()
        self.latest_annotated_frame: Optional[np.ndarray] = None
        self.is_active = False

    def start(self):
        self.camera.start()
        self.is_active = True
        logger.info("Vision Pipeline started.")

    def stop(self):
        self.is_active = False
        self.camera.stop()
        logger.info("Vision Pipeline stopped.")

    def process_current_frame(self) -> Tuple[Optional[np.ndarray], List[Dict[str, Any]]]:
        """
        Executes the full computer vision pipeline on the current camera frame:
        1. Capture frame
        2. Detect all faces (dense detector)
        3. Extract ArcFace 512-D embeddings
        4. FAISS cosine similarity search
        5. Prototype liveness evaluation
        6. If burst is active, record observations
        7. Annotate frame with modern visual UI
        """
        raw_frame = self.camera.get_frame()
        if raw_frame is None:
            return None, []

        start_time = time.time()
        annotated_frame = raw_frame.copy()
        h, w, _ = annotated_frame.shape

        # 1. Face Detection
        faces = self.detector.detect_faces(raw_frame)
        
        detected_results = []
        matching_latencies = []

        for idx, face in enumerate(faces):
            # Extract bbox
            x1, y1, x2, y2 = [int(v) for v in face.bbox]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            # Extract ArcFace 512-D Embedding
            t0 = time.time()
            embedding = self.recognizer.extract_embedding(face)
            
            # FAISS Similarity Search
            matched_student, similarity = faiss_service.search_face(embedding)
            match_time = (time.time() - t0) * 1000.0  # ms
            matching_latencies.append(match_time)

            # Head Pose
            yaw, pitch, roll = self.detector.extract_landmarks_and_pose(face)

            # Liveness Verification
            track_id = matched_student["student_code"] if matched_student else f"unknown_{idx}"
            is_live, liveness_score, liveness_label = self.liveness.evaluate_liveness(track_id, face, raw_frame)

            is_known = matched_student is not None
            identity_name = matched_student["name"] if is_known else "UNKNOWN"
            roll_number = matched_student.get("roll_number", "") if is_known else ""
            student_id = matched_student.get("student_id") if is_known else None

            # Record burst observation if a verification burst is currently running
            if attendance_service.is_burst_active and is_known and student_id:
                attendance_service.record_burst_observation(
                    student_id=student_id,
                    confidence=similarity,
                    liveness_status=liveness_label,
                    liveness_score=liveness_score
                )

            # Annotation color styling:
            # Navy & Gold aesthetic:
            # Known + Live: Vibrant Emerald Green (0, 220, 115)
            # Known + Liveness Failed: Bright Amber / Warning (0, 140, 255)
            # Unknown: Slate / Crimson (70, 70, 220)
            if is_known and is_live:
                box_color = (115, 220, 0)  # BGR
            elif is_known and not is_live:
                box_color = (0, 140, 255)
            else:
                box_color = (60, 60, 220)

            # Draw stylish rounded corners / bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), box_color, 2)

            # Draw top info tag
            tag_text = f"{identity_name} ({similarity:.2f})"
            if is_known and roll_number:
                sub_tag = f"Roll: {roll_number} | {liveness_label}"
            else:
                sub_tag = f"{liveness_label} | Yaw: {yaw:.0f}°"

            # Tag background badge
            (tw, th), _ = cv2.getTextSize(tag_text, cv2.FONT_HERSHEY_DUPLEX, 0.5, 1)
            badge_y1 = max(0, y1 - 36)
            cv2.rectangle(annotated_frame, (x1, badge_y1), (x1 + max(tw + 15, 180), y1), (18, 25, 38), -1)
            cv2.rectangle(annotated_frame, (x1, badge_y1), (x1 + max(tw + 15, 180), y1), box_color, 1)
            
            cv2.putText(
                annotated_frame, tag_text, (x1 + 6, badge_y1 + 16),
                cv2.FONT_HERSHEY_DUPLEX, 0.45, (255, 255, 255), 1
            )
            cv2.putText(
                annotated_frame, sub_tag, (x1 + 6, badge_y1 + 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 215, 230), 1
            )

            detected_results.append({
                "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "identity": identity_name,
                "student_id": student_id,
                "roll_number": roll_number,
                "confidence": round(similarity, 3),
                "is_known": is_known,
                "liveness_status": liveness_label,
                "liveness_score": liveness_score,
                "yaw": round(yaw, 1),
                "pitch": round(pitch, 1)
            })

        # Draw HUD Overlay Banner
        self._draw_hud(annotated_frame, faces_count=len(faces))

        # Store latest telemetry
        attendance_service.current_frame_faces = detected_results
        if matching_latencies:
            attendance_service.last_matching_latency_ms = round(float(np.mean(matching_latencies)), 2)
        else:
            attendance_service.last_matching_latency_ms = 0.0

        self.latest_annotated_frame = annotated_frame
        return annotated_frame, detected_results

    def _draw_hud(self, frame: np.ndarray, faces_count: int):
        h, w, _ = frame.shape
        # Top banner background (Navy dark blue)
        cv2.rectangle(frame, (0, 0), (w, 42), (15, 23, 42), -1)
        cv2.line(frame, (0, 42), (w, 42), (218, 165, 32), 2)  # Subtle gold line

        # Project title badge
        cv2.putText(
            frame, "AI SMART ATTENDANCE", (12, 26),
            cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1
        )

        # Temporal Interval Status
        cur_int = attendance_service.current_interval_index
        tot_int = settings.TOTAL_INTERVALS
        is_burst = attendance_service.is_burst_active
        mode_text = "DEMO MODE" if settings.IS_DEMO_MODE else "REAL MODE"

        if is_burst:
            rem = attendance_service.get_live_stats()["burst_remaining_seconds"]
            status_text = f"INTERVAL {cur_int}/{tot_int}: BURST ACTIVE ({rem:.1f}s)"
            badge_color = (0, 200, 100)
        else:
            if cur_int == 0:
                status_text = f"SESSION READY - {mode_text}"
            elif cur_int >= tot_int:
                status_text = "ALL 5 INTERVALS COMPLETED"
            else:
                next_in = attendance_service.get_live_stats()["next_interval_in_seconds"]
                status_text = f"INTERVAL {cur_int}/{tot_int} DONE | NEXT IN {next_in:.0f}s"
            badge_color = (200, 180, 50)

        cv2.putText(
            frame, status_text, (260, 26),
            cv2.FONT_HERSHEY_DUPLEX, 0.45, badge_color, 1
        )

        # FPS & Detected count
        fps_val = self.camera.get_fps()
        stat_text = f"FPS: {fps_val} | Faces: {faces_count}"
        cv2.putText(
            frame, stat_text, (w - 180, 26),
            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 220, 240), 1
        )

vision_pipeline = VisionPipeline()
