import pytest
import cv2
import numpy as np
from model.face_matching.matcher import FaceMatcher
from model.tests.test_face_pad import create_synthetic_face_image

def test_face_matcher_same_identity():
    matcher = FaceMatcher()
    face_img = create_synthetic_face_image()
    
    response = matcher.match(face_img, face_img, threshold=0.60)
    assert response.status == "completed"
    assert response.matched is True
    # Identical image cosine similarity should be >= 0.99
    assert response.similarity_score >= 0.95

def test_face_matcher_different_identity():
    matcher = FaceMatcher()
    face_img1 = create_synthetic_face_image()
    
    # Generate visually distinct image
    img2 = np.zeros((300, 300, 3), dtype=np.uint8)
    cv2.rectangle(img2, (50, 50), (250, 250), (100, 200, 50), -1)
    _, enc2 = cv2.imencode(".jpg", img2)
    face_img2 = enc2.tobytes()
    
    response = matcher.match(face_img1, face_img2, threshold=0.75)
    assert response.status == "completed"
    assert response.matched is False
