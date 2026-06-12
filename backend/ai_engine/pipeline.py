import asyncio
import base64
import time
from dataclasses import dataclass, field
from typing import Optional
import cv2
import numpy as np
from ai_engine.face_detector import FaceDetector
from ai_engine.gaze_tracker import GazeTracker
from ai_engine.head_pose import HeadPoseEstimator
from ai_engine.phone_detector import PhoneDetector
from ai_engine.person_counter import PersonCounter
from ai_engine.suspicion_engine import SuspicionEngine

@dataclass
class FrameAnalysisResult:
    session_id: str
    timestamp: float = field(default_factory=time.time)
    face_present: bool = False
    face_count: int = 0
    gaze_direction: Optional[str] = None
    head_pose: Optional[dict] = None
    phone_detected: bool = False
    person_count: int = 0
    suspicion_score: float = 0.0
    risk_level: str = "low"
    violations: list = field(default_factory=list)
    thumbnail_b64: Optional[str] = None

class ProctorPipeline:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.face_detector = FaceDetector()
        self.gaze_tracker = GazeTracker()
        self.head_pose = HeadPoseEstimator()
        self.phone_detector = PhoneDetector()
        self.person_counter = PersonCounter()
        self.suspicion_engine = SuspicionEngine()
        self._frame_count = 0

    def analyse_frame(self, frame_bytes: bytes) -> FrameAnalysisResult:
        result = FrameAnalysisResult(session_id=self.session_id)
        self._frame_count += 1

        np_arr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            return result

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        faces = self.face_detector.detect(frame)
        result.face_count = len(faces)
        result.face_present = result.face_count >= 1
        result.person_count = self.person_counter.count(frame)

        if result.face_present:
            result.gaze_direction = self.gaze_tracker.estimate(rgb)
            result.head_pose = self.head_pose.estimate(rgb)

        result.phone_detected = self.phone_detector.detect(frame)

        result.suspicion_score, result.risk_level, result.violations = (
            self.suspicion_engine.evaluate(result)
        )

        if result.risk_level in ("high", "severe"):
            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            result.thumbnail_b64 = base64.b64encode(buf).decode()

        return result
