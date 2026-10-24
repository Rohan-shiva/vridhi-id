import io
import pytest
import numpy as np
import soundfile as sf
from model.speaker_recognition.verifier import SpeakerVerifier

def generate_synthetic_audio(freq: float = 220.0, duration: float = 2.0, sr: int = 16000) -> bytes:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # Fundamental + harmonics to simulate vocal cords
    signal = 0.5 * np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * 2 * freq * t) + 0.1 * np.sin(2 * np.pi * 3 * freq * t)
    buf = io.BytesIO()
    sf.write(buf, signal.astype(np.float32), sr, format='WAV')
    return buf.getvalue()

def test_speaker_verification_same_voice():
    verifier = SpeakerVerifier()
    audio_sample = generate_synthetic_audio(freq=200.0, duration=2.2)
    
    response = verifier.verify(audio_sample, audio_sample, threshold=0.68)
    assert response.status == "completed"
    assert response.verified is True
    assert response.similarity_score >= 0.95
    assert response.quality.is_sufficient_length is True

def test_speaker_verification_short_audio():
    verifier = SpeakerVerifier()
    short_audio = generate_synthetic_audio(freq=200.0, duration=0.4)
    
    response = verifier.verify(short_audio, short_audio, threshold=0.68)
    assert response.status == "failed"
    assert response.quality.is_sufficient_length is False
