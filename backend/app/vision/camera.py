import cv2
import time
import threading
import numpy as np
import logging
from typing import Optional, Tuple

logger = logging.getLogger("attendance.vision.camera")

class CameraStream:
    def __init__(self, source: str = "0"):
        self.source = source
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.current_frame: Optional[np.ndarray] = None
        self.lock = threading.Lock()
        self.fps = 0.0
        self.frame_count = 0
        self.start_time = time.time()
        self.thread: Optional[threading.Thread] = None
        self.is_simulation = False

    def start(self):
        if self.is_running:
            return

        # Determine source
        src = 0
        use_dshow = False
        if self.source.isdigit():
            src = int(self.source)
            use_dshow = True
        elif self.source.lower() == "webcam":
            src = 0
            use_dshow = True
        elif self.source.lower() == "simulation":
            src = "simulation"
        else:
            src = self.source

        logger.info(f"Opening camera source: {src} (DirectShow: {use_dshow})")
        
        if src == "simulation":
            self.is_simulation = True
        else:
            try:
                # On Windows, cv2.CAP_DSHOW provides instant, reliable webcam connection
                if use_dshow:
                    self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
                else:
                    self.cap = cv2.VideoCapture(src)

                if isinstance(src, int):
                    self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    self.cap.set(cv2.CAP_PROP_FPS, 30)

                if not self.cap.isOpened():
                    logger.warning(f"Could not open camera {src}. Falling back to simulation.")
                    self.is_simulation = True
                else:
                    # Retry reading a few times to allow sensor to warm up
                    opened = False
                    for _ in range(5):
                        ret, test_frame = self.cap.read()
                        if ret and test_frame is not None:
                            self.current_frame = test_frame
                            self.is_simulation = False
                            opened = True
                            logger.info(f"Laptop webcam {src} successfully active with frame size: {test_frame.shape}")
                            break
                        time.sleep(0.1)

                    if not opened:
                        logger.warning("Camera opened but failed to read initial frames. Falling back to simulation.")
                        self.is_simulation = True
            except Exception as e:
                logger.warning(f"Exception opening camera {src}: {e}. Falling back to simulation.")
                self.is_simulation = True

        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(f"Camera stream started (Simulation: {self.is_simulation})")

    def _generate_synthetic_classroom_frame(self) -> np.ndarray:
        frame = np.full((480, 640, 3), 35, dtype=np.uint8)
        cv2.rectangle(frame, (20, 20), (620, 460), (45, 52, 64), -1)
        cv2.rectangle(frame, (20, 20), (620, 70), (28, 35, 45), -1)
        
        cv2.putText(
            frame, "AI SMART ATTENDANCE - CLASSROOM FEED", 
            (40, 52), cv2.FONT_HERSHEY_DUPLEX, 0.65, (230, 235, 245), 1
        )
        
        t_str = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(
            frame, t_str, 
            (420, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 180, 210), 1
        )

        offset_y = int(3 * np.sin(time.time() * 2))
        
        # Student 1: Stuti Rai
        cv2.circle(frame, (200, 240 + offset_y), 50, (180, 160, 140), -1)
        cv2.ellipse(frame, (200, 330 + offset_y), (80, 45), 0, 0, 180, (80, 120, 180), -1)
        cv2.putText(frame, "Desk A1", (170, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

        # Student 2: Shivani Singh
        cv2.circle(frame, (440, 240 - offset_y), 50, (175, 155, 145), -1)
        cv2.ellipse(frame, (440, 330 - offset_y), (80, 45), 0, 0, 180, (180, 120, 80), -1)
        cv2.putText(frame, "Desk A2", (410, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

        return frame

    def _capture_loop(self):
        last_time = time.time()
        while self.is_running:
            if not self.is_simulation and self.cap is not None and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret and frame is not None:
                    with self.lock:
                        self.current_frame = frame
                else:
                    time.sleep(0.01)
            else:
                frame = self._generate_synthetic_classroom_frame()
                with self.lock:
                    self.current_frame = frame
                time.sleep(0.033)

            self.frame_count += 1
            now = time.time()
            if now - last_time >= 1.0:
                self.fps = self.frame_count / (now - last_time)
                self.frame_count = 0
                last_time = now

    def get_frame(self) -> Optional[np.ndarray]:
        with self.lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return None

    def get_fps(self) -> float:
        return round(self.fps, 1)

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.cap:
            self.cap.release()
            self.cap = None
        logger.info("Camera stream stopped.")
