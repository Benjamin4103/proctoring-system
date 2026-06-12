from ultralytics import YOLO

class PhoneDetector:
    def __init__(self):
        self.model = YOLO("yolov8n.pt")
        self.phone_class_id = 67  # COCO class id for cell phone

    def detect(self, frame) -> bool:
        results = self.model(frame, classes=[self.phone_class_id], verbose=False)
        for r in results:
            for box in r.boxes:
                if box.conf[0] > 0.5:
                    return True
        return False
