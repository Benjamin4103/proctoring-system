import cv2
import numpy as np
import mediapipe as mp

class HeadPoseEstimator:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.model_points = np.array([
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0, -150.0, -125.0)
        ])

    def estimate(self, rgb_frame) -> dict:
        try:
            results = self.face_mesh.process(rgb_frame)
            if not results.multi_face_landmarks:
                return None
            h, w = rgb_frame.shape[:2]
            landmarks = results.multi_face_landmarks[0].landmark
            image_points = np.array([
                (landmarks[1].x * w, landmarks[1].y * h),
                (landmarks[152].x * w, landmarks[152].y * h),
                (landmarks[226].x * w, landmarks[226].y * h),
                (landmarks[446].x * w, landmarks[446].y * h),
                (landmarks[57].x * w, landmarks[57].y * h),
                (landmarks[287].x * w, landmarks[287].y * h),
            ], dtype=np.float64)
            focal_length = w
            camera_matrix = np.array([
                [focal_length, 0, w/2],
                [0, focal_length, h/2],
                [0, 0, 1]
            ], dtype=np.float64)
            dist_coeffs = np.zeros((4, 1))
            success, rotation_vec, translation_vec = cv2.solvePnP(
                self.model_points, image_points, camera_matrix, dist_coeffs
            )
            if not success:
                return None
            rotation_mat, _ = cv2.Rodrigues(rotation_vec)
            pose_mat = cv2.hconcat([rotation_mat, translation_vec])
            _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)
            return {
                "pitch": float(euler_angles[0]),
                "yaw": float(euler_angles[1]),
                "roll": float(euler_angles[2])
            }
        except Exception:
            return None
