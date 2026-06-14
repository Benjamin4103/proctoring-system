import face_recognition
import numpy as np
import pickle
import base64
import cv2

def encode_face_from_image(image_bytes: bytes):
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb)
    if not encodings:
        return None
    return pickle.dumps(encodings[0])

def verify_face(image_bytes: bytes, stored_embedding: bytes) -> dict:
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb)
    if not encodings:
        return {"verified": False, "reason": "No face detected in image"}
    known = pickle.loads(stored_embedding)
    distances = face_recognition.face_distance([known], encodings[0])
    match = bool(distances[0] < 0.5)
    confidence = round(float(1 - distances[0]), 2)
    return {
        "verified": match,
        "confidence": confidence,
        "reason": "Identity verified" if match else "Face does not match registered photo"
    }
