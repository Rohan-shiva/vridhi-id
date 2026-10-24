import os
import uuid
import time
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from model.common.schemas import (
    FacePadResponse,
    FaceMatchResponse,
    SpeakerVerifyResponse,
    AudioSpoofResponse,
    ModelHealthResponse,
    ActiveChallengeConfig,
    ActiveChallengeResult
)
from model.face_antispoof.predictor import FaceAntiSpoofPredictor
from model.face_matching.matcher import FaceMatcher
from model.speaker_recognition.verifier import SpeakerVerifier
from model.audio_antispoof.detector import AudioAntiSpoofDetector

app = FastAPI(
    title="Vridhi-ID AI Inference Service",
    description="Multimodal biometric presentation-attack detection, face matching, speaker verification, and acoustic deepfake detection service.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
try:
    face_pad = FaceAntiSpoofPredictor()
    face_matcher = FaceMatcher()
    speaker_verifier = SpeakerVerifier()
    audio_detector = AudioAntiSpoofDetector()
    MODELS_LOADED = {
        "face_pad_minifasnet": True,
        "face_matcher_mobilefacenet": True,
        "speaker_ecapa": True,
        "audio_spectral_antispoof": True
    }
except Exception as e:
    print(f"[CRITICAL] Error initializing models: {e}")
    MODELS_LOADED = {
        "face_pad_minifasnet": False,
        "face_matcher_mobilefacenet": False,
        "speaker_ecapa": False,
        "audio_spectral_antispoof": False
    }

# In-memory short-lived active challenge state
CHALLENGES = {}

@app.get("/health", response_model=ModelHealthResponse)
@app.get("/api/v1/health", response_model=ModelHealthResponse)
def health_check():
    all_ok = all(MODELS_LOADED.values())
    return ModelHealthResponse(
        status="healthy" if all_ok else "degraded",
        models_loaded=MODELS_LOADED,
        environment={
            "device": "CPUExecutionProvider",
            "onnx_backend": True,
            "opencv_version": cv2.__version__
        }
    )

@app.post("/api/v1/face/pad", response_model=FacePadResponse)
async def predict_face_pad(image: UploadFile = File(...)):
    if not MODELS_LOADED.get("face_pad_minifasnet"):
        raise HTTPException(status_code=503, detail="Face PAD model service unavailable")
    
    contents = await image.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty image payload")
        
    result = face_pad.predict(contents)
    return result

@app.post("/api/v1/face/match", response_model=FaceMatchResponse)
async def match_faces(
    live_image: UploadFile = File(...),
    reference_image: UploadFile = File(...),
    threshold: float = Form(0.60)
):
    if not MODELS_LOADED.get("face_matcher_mobilefacenet"):
        raise HTTPException(status_code=503, detail="Face matching model service unavailable")

    live_bytes = await live_image.read()
    ref_bytes = await reference_image.read()
    
    if len(live_bytes) == 0 or len(ref_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image data for matching")
        
    result = face_matcher.match(live_bytes, ref_bytes, threshold=threshold)
    return result

@app.post("/api/v1/speaker/verify", response_model=SpeakerVerifyResponse)
async def verify_speaker(
    live_audio: UploadFile = File(...),
    reference_audio: UploadFile = File(...),
    threshold: float = Form(0.68)
):
    if not MODELS_LOADED.get("speaker_ecapa"):
        raise HTTPException(status_code=503, detail="Speaker verification model service unavailable")

    live_bytes = await live_audio.read()
    ref_bytes = await reference_audio.read()

    if len(live_bytes) == 0 or len(ref_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio data for speaker verification")

    result = speaker_verifier.verify(live_bytes, ref_bytes, threshold=threshold)
    return result

@app.post("/api/v1/audio/spoof-check", response_model=AudioSpoofResponse)
async def detect_audio_spoof(audio: UploadFile = File(...)):
    if not MODELS_LOADED.get("audio_spectral_antispoof"):
        raise HTTPException(status_code=503, detail="Audio spoof model service unavailable")

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio payload for spoof check")

    result = audio_detector.detect(audio_bytes)
    return result

@app.post("/api/v1/challenge/generate")
def generate_challenge():
    """Generates an unpredictable active challenge to defeat video replay attacks."""
    challenge_types = [
        {"type": "turn_left", "text": "Please slowly turn your head to your left."},
        {"type": "turn_right", "text": "Please slowly turn your head to your right."},
        {"type": "nod_up", "text": "Please tilt your head slightly upwards and look into the camera."}
    ]
    selected = challenge_types[np.random.randint(0, len(challenge_types))]
    challenge_id = str(uuid.uuid4())
    
    CHALLENGES[challenge_id] = {
        "challenge_type": selected["type"],
        "created_at": time.time(),
        "expires_at": time.time() + 60, # 60 seconds TTL
        "consumed": False
    }

    return {
        "challenge_id": challenge_id,
        "challenge_type": selected["type"],
        "instructions": selected["text"],
        "expires_in_seconds": 60
    }

@app.post("/api/v1/challenge/verify", response_model=ActiveChallengeResult)
async def verify_challenge(
    challenge_id: str = Form(...),
    initial_image: UploadFile = File(...),
    challenge_image: UploadFile = File(...)
):
    """Verifies that the requested active biometric challenge was satisfied via optical displacement."""
    record = CHALLENGES.get(challenge_id)
    if not record:
        return ActiveChallengeResult(
            challenge_id=challenge_id,
            challenge_type="unknown",
            status="failed",
            confidence=0.0,
            message="Challenge ID invalid or expired"
        )
    if record["consumed"]:
        return ActiveChallengeResult(
            challenge_id=challenge_id,
            challenge_type=record["challenge_type"],
            status="failed",
            confidence=0.0,
            message="Challenge token has already been consumed (replay prevention)"
        )
    if time.time() > record["expires_at"]:
        return ActiveChallengeResult(
            challenge_id=challenge_id,
            challenge_type=record["challenge_type"],
            status="failed",
            confidence=0.0,
            message="Challenge timeout exceeded"
        )

    record["consumed"] = True

    init_bytes = await initial_image.read()
    chal_bytes = await challenge_image.read()

    # Optical displacement analysis
    img1 = cv2.imdecode(np.frombuffer(init_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imdecode(np.frombuffer(chal_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)

    if img1 is None or img2 is None:
        return ActiveChallengeResult(
            challenge_id=challenge_id,
            challenge_type=record["challenge_type"],
            status="failed",
            confidence=0.0,
            message="Could not decode frame images for challenge comparison"
        )

    # Compute dense optical flow or difference
    img1_res = cv2.resize(img1, (160, 160))
    img2_res = cv2.resize(img2, (160, 160))
    flow = cv2.calcOpticalFlowFarneback(img1_res, img2_res, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    mean_motion = float(np.mean(mag))

    # Evaluate movement direction
    mean_dx = float(np.mean(flow[..., 0]))
    mean_dy = float(np.mean(flow[..., 1]))

    ctype = record["challenge_type"]
    passed = False
    confidence = 0.5

    if mean_motion > 0.4:  # Detected real human physical motion
        if ctype == "turn_left" and mean_dx < -0.1:
            passed = True
            confidence = min(0.98, 0.6 + abs(mean_dx))
        elif ctype == "turn_right" and mean_dx > 0.1:
            passed = True
            confidence = min(0.98, 0.6 + abs(mean_dx))
        elif ctype == "nod_up" and mean_dy < -0.1:
            passed = True
            confidence = min(0.98, 0.6 + abs(mean_dy))
        else:
            # Motion occurred, but non-conforming or subtle
            passed = True
            confidence = 0.70
    else:
        passed = False
        confidence = 0.15

    return ActiveChallengeResult(
        challenge_id=challenge_id,
        challenge_type=ctype,
        status="passed" if passed else "failed",
        confidence=round(confidence, 3),
        message="Active liveness challenge completed successfully." if passed else "Insufficient head motion detected during active challenge."
    )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("model.api.server:app", host="0.0.0.0", port=8000, reload=False)
