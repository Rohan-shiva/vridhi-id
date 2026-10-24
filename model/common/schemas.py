from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ImageQualityMetrics(BaseModel):
    face_detected: bool = Field(..., description="Whether a human face landmark was localized")
    brightness_score: float = Field(..., description="Normalized frame brightness (0.0 to 1.0)")
    sharpness_score: float = Field(..., description="Laplacian variance sharpness score")
    is_adequately_lit: bool = Field(..., description="Lighting is within acceptable range")
    is_sharp: bool = Field(..., description="Image is not excessively blurred")

class FacePadResponse(BaseModel):
    model: str = "face_pad_minifasnet"
    model_version: str = "2.1.0-onnx"
    status: str = Field(..., description="'completed', 'failed', or 'uncertain'")
    prediction: str = Field(..., description="'live', 'spoof', or 'uncertain'")
    live_probability: float = Field(..., ge=0.0, le=1.0, description="Calibrated live probability")
    spoof_probability: float = Field(..., ge=0.0, le=1.0, description="Spoof attack probability")
    decision_threshold: float = 0.65
    quality: ImageQualityMetrics
    message: Optional[str] = None

class FaceMatchResponse(BaseModel):
    model: str = "mobilefacenet_arcface"
    model_version: str = "1.4.0-onnx"
    status: str = "completed"
    matched: bool = Field(..., description="Whether cosine similarity meets matching threshold")
    similarity_score: float = Field(..., ge=-1.0, le=1.0, description="Cosine similarity score")
    threshold: float = 0.60
    distance_metric: str = "cosine"
    message: Optional[str] = None

class AudioQualityMetrics(BaseModel):
    duration_seconds: float
    sample_rate: int
    rms_energy: float
    snr_estimate_db: float
    is_sufficient_length: bool

class SpeakerVerifyResponse(BaseModel):
    model: str = "speaker_ecapa_acoustic"
    model_version: str = "1.2.0"
    status: str = "completed"
    verified: bool = Field(..., description="Whether voice matches enrolled speaker template")
    similarity_score: float = Field(..., ge=-1.0, le=1.0, description="Acoustic cosine similarity")
    threshold: float = 0.68
    quality: AudioQualityMetrics
    message: Optional[str] = None

class AudioSpoofResponse(BaseModel):
    model: str = "audio_spectral_antispoof"
    model_version: str = "1.5.0"
    status: str = "completed"
    prediction: str = Field(..., description="'bonafide', 'spoof', or 'uncertain'")
    bonafide_probability: float = Field(..., ge=0.0, le=1.0)
    spoof_probability: float = Field(..., ge=0.0, le=1.0)
    spectral_flatness: float
    high_freq_ratio: float
    clipping_ratio: float
    anomaly_flags: List[str] = []
    message: Optional[str] = None

class ActiveChallengeConfig(BaseModel):
    challenge_type: str = Field(..., description="'turn_left', 'turn_right', 'nod_up', 'smile', 'blink'")
    instructions: str
    time_limit_seconds: int = 15

class ActiveChallengeResult(BaseModel):
    challenge_id: str
    challenge_type: str
    status: str  # passed, failed, timeout
    confidence: float
    message: Optional[str] = None

class ModelHealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    environment: Dict[str, Any]
    version: str = "1.0.0"
