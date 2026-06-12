import cv2
import numpy as np
from ultralytics import YOLO

class FaceDetector:
    def __init__(self):
        self.model = YOLO("yolov8n.pt")

    def detect(self, frame):
        results = self.model(frame, classes=[0], verbose=False)
        faces = []
        for r in results:
            for box in r.boxes:
                if box.conf[0] > 0.5:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    faces.append((x1, y1, x2, y2))
        return faces
