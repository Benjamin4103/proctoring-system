import cv2
import numpy as np
import mediapipe as mp

class GazeTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]
        self.LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        self.RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

    def estimate(self, rgb_frame) -> str:
        try:
            results = self.face_mesh.process(rgb_frame)
            if not results.multi_face_landmarks:
                return "unknown"
            landmarks = results.multi_face_landmarks[0].landmark
            h, w = rgb_frame.shape[:2]
            left_iris = np.mean([[landmarks[i].x * w, landmarks[i].y * h] for i in self.LEFT_IRIS], axis=0)
            right_iris = np.mean([[landmarks[i].x * w, landmarks[i].y * h] for i in self.RIGHT_IRIS], axis=0)
            left_eye_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in self.LEFT_EYE])
            right_eye_pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in self.RIGHT_EYE])
            left_ratio = (left_iris[0] - left_eye_pts[:,0].min()) / (left_eye_pts[:,0].max() - left_eye_pts[:,0].min() + 1e-6)
            right_ratio = (right_iris[0] - right_eye_pts[:,0].min()) / (right_eye_pts[:,0].max() - right_eye_pts[:,0].min() + 1e-6)
            avg_ratio = (left_ratio + right_ratio) / 2
            if avg_ratio < 0.35:
                return "left"
            elif avg_ratio > 0.65:
                return "right"
            else:
                return "center"
        except Exception:
            return "unknown"
