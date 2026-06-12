from ai_engine.pipeline import ProctorPipeline
import cv2

pipeline = ProctorPipeline(session_id="test-session")

cap = cv2.VideoCapture(0)
ret, frame = cap.read()
cap.release()

if ret:
    _, buf = cv2.imencode(".jpg", frame)
    result = pipeline.analyse_frame(buf.tobytes())
    print(f"Face present: {result.face_present}")
    print(f"Person count: {result.person_count}")
    print(f"Gaze: {result.gaze_direction}")
    print(f"Head pose: {result.head_pose}")
    print(f"Phone detected: {result.phone_detected}")
    print(f"Suspicion score: {result.suspicion_score}")
    print(f"Risk level: {result.risk_level}")
    print(f"Violations: {[v.type for v in result.violations]}")
else:
    print("No webcam found - testing with blank frame")
    import numpy as np
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", blank)
    result = pipeline.analyse_frame(buf.tobytes())
    print(f"Score: {result.suspicion_score}, Risk: {result.risk_level}")
