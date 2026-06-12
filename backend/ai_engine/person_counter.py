from ultralytics import YOLO

class PersonCounter:
    def __init__(self):
        self.model = YOLO("yolov8n.pt")
        self.person_class_id = 0  # COCO class id for person

    def count(self, frame) -> int:
        results = self.model(frame, classes=[self.person_class_id], verbose=False)
        count = 0
        for r in results:
            for box in r.boxes:
                if box.conf[0] > 0.5:
                    count += 1
        return count
