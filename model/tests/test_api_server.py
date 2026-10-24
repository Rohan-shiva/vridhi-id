import io
import pytest
from fastapi.testclient import TestClient
from model.api.server import app
from model.tests.test_face_pad import create_synthetic_face_image
from model.tests.test_speaker_verify import generate_synthetic_audio

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"]["face_pad_minifasnet"] is True
    assert data["models_loaded"]["face_matcher_mobilefacenet"] is True
    assert data["models_loaded"]["speaker_ecapa"] is True
    assert data["models_loaded"]["audio_spectral_antispoof"] is True

def test_face_pad_endpoint():
    face_bytes = create_synthetic_face_image()
    files = {"image": ("face.jpg", face_bytes, "image/jpeg")}
    response = client.post("/api/v1/face/pad", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "face_pad_minifasnet"
    assert "live_probability" in data
    assert "spoof_probability" in data
    assert "quality" in data

def test_face_match_endpoint():
    face_bytes = create_synthetic_face_image()
    files = {
        "live_image": ("live.jpg", face_bytes, "image/jpeg"),
        "reference_image": ("ref.jpg", face_bytes, "image/jpeg")
    }
    response = client.post("/api/v1/face/match", files=files, data={"threshold": "0.60"})
    assert response.status_code == 200
    data = response.json()
    assert data["matched"] is True
    assert data["similarity_score"] >= 0.95

def test_speaker_verify_endpoint():
    audio_bytes = generate_synthetic_audio(freq=220.0, duration=2.0)
    files = {
        "live_audio": ("live.wav", audio_bytes, "audio/wav"),
        "reference_audio": ("ref.wav", audio_bytes, "audio/wav")
    }
    response = client.post("/api/v1/speaker/verify", files=files, data={"threshold": "0.68"})
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is True
    assert data["similarity_score"] >= 0.95

def test_audio_spoof_endpoint():
    audio_bytes = generate_synthetic_audio(freq=220.0, duration=2.0)
    files = {"audio": ("sample.wav", audio_bytes, "audio/wav")}
    response = client.post("/api/v1/audio/spoof-check", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "bonafide_probability" in data
    assert "spoof_probability" in data

def test_active_challenge_lifecycle():
    # 1. Generate challenge
    gen_resp = client.post("/api/v1/challenge/generate")
    assert gen_resp.status_code == 200
    chal = gen_resp.json()
    assert "challenge_id" in chal
    assert "challenge_type" in chal
    
    # 2. Verify challenge with frames
    f1 = create_synthetic_face_image()
    f2 = create_synthetic_face_image()
    files = {
        "initial_image": ("f1.jpg", f1, "image/jpeg"),
        "challenge_image": ("f2.jpg", f2, "image/jpeg")
    }
    v_resp = client.post(
        "/api/v1/challenge/verify",
        data={"challenge_id": chal["challenge_id"]},
        files=files
    )
    assert v_resp.status_code == 200
    v_data = v_resp.json()
    assert v_data["challenge_id"] == chal["challenge_id"]
    assert "status" in v_data
