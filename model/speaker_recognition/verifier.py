import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import Optional, Tuple
from model.common.schemas import SpeakerVerifyResponse, AudioQualityMetrics
from model.common.audio_utils import load_and_preprocess_audio, compute_audio_quality, compute_mel_spectrogram

class SpeakerVerifier:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights", "speaker_ecapa_projector.onnx")

        self.model_path = model_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Speaker model weights missing at {model_path}")

        opts = ort.SessionOptions()
        opts.inter_op_num_threads = 2
        opts.intra_op_num_threads = 2
        self.session = ort.InferenceSession(model_path, sess_options=opts, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name

    def extract_embedding(self, audio_bytes: bytes) -> Tuple[Optional[np.ndarray], AudioQualityMetrics, Optional[str]]:
        try:
            audio, sr = load_and_preprocess_audio(audio_bytes, target_sr=16000)
        except Exception as e:
            fallback_quality = AudioQualityMetrics(
                duration_seconds=0.0,
                sample_rate=16000,
                rms_energy=0.0,
                snr_estimate_db=0.0,
                is_sufficient_length=False
            )
            return None, fallback_quality, str(e)

        quality_dict = compute_audio_quality(audio, sr)
        quality = AudioQualityMetrics(**quality_dict)

        if not quality.is_sufficient_length:
            return None, quality, "Audio sample is too short. Please speak clearly for at least 2 seconds."

        mel_spec = compute_mel_spectrogram(audio, sr=16000, n_mels=80)
        # Target shape for model is [1, 80, 100]
        # Pad or resize time axis to 100 frames
        if mel_spec.shape[1] < 100:
            pad_width = 100 - mel_spec.shape[1]
            mel_spec = np.pad(mel_spec, ((0, 0), (0, pad_width)), mode='edge')
        elif mel_spec.shape[1] > 100:
            mel_spec = mel_spec[:, :100]

        input_tensor = mel_spec[np.newaxis, ...].astype(np.float32)  # [1, 80, 100]
        outputs = self.session.run(None, {self.input_name: input_tensor})
        embedding = outputs[0][0]  # [192]
        norm = np.linalg.norm(embedding)
        if norm > 1e-6:
            embedding = embedding / norm

        return embedding, quality, None

    def verify(self, live_audio_bytes: bytes, reference_embedding_or_audio: bytes, threshold: float = 0.68) -> SpeakerVerifyResponse:
        live_emb, quality, err = self.extract_embedding(live_audio_bytes)
        if live_emb is None:
            return SpeakerVerifyResponse(
                status="failed",
                verified=False,
                similarity_score=0.0,
                threshold=threshold,
                quality=quality,
                message=err or "Failed to process live audio sample"
            )

        # Check if reference is raw audio or serialized embedding
        ref_emb = None
        if len(reference_embedding_or_audio) == 192 * 4: # Float32 array
            ref_emb = np.frombuffer(reference_embedding_or_audio, dtype=np.float32)
        else:
            # Extract from audio bytes
            r_emb, _, r_err = self.extract_embedding(reference_embedding_or_audio)
            ref_emb = r_emb

        if ref_emb is None:
            return SpeakerVerifyResponse(
                status="failed",
                verified=False,
                similarity_score=0.0,
                threshold=threshold,
                quality=quality,
                message="Enrolled speaker reference template unavailable or corrupted"
            )

        similarity = float(np.dot(live_emb, ref_emb))
        similarity = max(-1.0, min(1.0, similarity))
        verified = bool(similarity >= threshold)

        msg = "Speaker identity matched enrolled pension profile." if verified else "Speaker voice characteristics do not match enrolled profile."

        return SpeakerVerifyResponse(
            status="completed",
            verified=verified,
            similarity_score=round(similarity, 4),
            threshold=threshold,
            quality=quality,
            message=msg
        )
