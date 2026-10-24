import pytest
import cv2
import numpy as np
from model.face_antispoof.predictor import FaceAntiSpoofPredictor

def create_synthetic_face_image() -> bytes:
    """Creates a synthetic portrait with facial geometry recognizable by cascade."""
    img = np.full((300, 300, 3), (210, 210, 210), dtype=np.uint8)
    
    # Head / Face oval
    cv2.ellipse(img, (150, 150), (80, 110), 0, 0, 360, (180, 150, 130), -1)
    
    # Eyes
    cv2.circle(img, (120, 130), 12, (255, 255, 255), -1)
    cv2.circle(img, (180, 130), 12, (255, 255, 255), -1)
    cv2.circle(img, (120, 130), 5, (40, 30, 20), -1)
    cv2.circle(img, (180, 130), 5, (40, 30, 20), -1)
    
    # Nose line
    cv2.line(img, (150, 135), (150, 170), (120, 100, 90), 3)
    
    # Mouth
    cv2.ellipse(img, (150, 195), (25, 12), 0, 0, 180, (70, 60, 140), -1)
    
    _, enc = cv2.imencode(".jpg", img)
    return enc.tobytes()

def test_face_pad_inference():
    predictor = FaceAntiSpoofPredictor()
    face_bytes = create_synthetic_face_image()
    
    response = predictor.predict(face_bytes)
    assert response.model == "face_pad_minifasnet"
    assert response.status in ["completed", "uncertain"]
    assert 0.0 <= response.live_probability <= 1.0
    assert 0.0 <= response.spoof_probability <= 1.0
    assert response.quality is not None

def test_face_pad_invalid_image():
    predictor = FaceAntiSpoofPredictor()
    response = predictor.predict(b"not_an_image_data")
    assert response.status == "failed"
    assert response.quality.face_detected is False

def test_face_pad_blank_image():
    predictor = FaceAntiSpoofPredictor()
    blank = np.zeros((200, 200, 3), dtype=np.uint8)
    _, enc = cv2.imencode(".jpg", blank)
    response = predictor.predict(enc.tobytes())
    assert response.quality.face_detected is False
    assert response.status == "uncertain"
