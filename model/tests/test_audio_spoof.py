import pytest
from model.audio_antispoof.detector import AudioAntiSpoofDetector
from model.tests.test_speaker_verify import generate_synthetic_audio

def test_audio_spoof_detection_bonafide():
    detector = AudioAntiSpoofDetector()
    audio = generate_synthetic_audio(freq=180.0, duration=2.0)
    
    response = detector.detect(audio)
    assert response.status == "completed"
    assert response.prediction in ["bonafide", "uncertain", "spoof"]
    assert 0.0 <= response.bonafide_probability <= 1.0
    assert 0.0 <= response.spoof_probability <= 1.0

def test_audio_spoof_detection_short():
    detector = AudioAntiSpoofDetector()
    short_audio = generate_synthetic_audio(freq=180.0, duration=0.5)
    
    response = detector.detect(short_audio)
    assert response.status == "uncertain"
    assert "insufficient_duration" in response.anomaly_flags
