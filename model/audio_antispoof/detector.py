import os
import numpy as np
import onnxruntime as ort
from scipy import signal
from typing import Optional, List, Dict, Any
from model.common.schemas import AudioSpoofResponse
from model.common.audio_utils import load_and_preprocess_audio

class AudioAntiSpoofDetector:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights", "audio_spectral_antispoof.onnx")

        self.model_path = model_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Audio antispoof model weights missing at {model_path}")

        opts = ort.SessionOptions()
        opts.inter_op_num_threads = 2
        opts.intra_op_num_threads = 2
        self.session = ort.InferenceSession(model_path, sess_options=opts, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name

    def analyze_acoustic_anomalies(self, audio: np.ndarray, sr: int) -> Dict[str, Any]:
        """
        Calculates acoustic physical indicators:
        - High-frequency cutoff (synthetic vocoders frequently drop frequencies >7kHz or have sharp filters)
        - Spectral flatness (robotic/replayed voices exhibit artificial flatness)
        - Extreme amplitude clipping
        """
        flags = []
        if len(audio) < 1024:
            return {"flatness": 0.5, "hf_ratio": 0.5, "clipping": 0.0, "flags": ["insufficient_audio"]}

        # Clipping ratio (samples within 0.5% of rail)
        clipping_samples = np.sum(np.abs(audio) > 0.99)
        clipping_ratio = float(clipping_samples / len(audio))
        if clipping_ratio > 0.05:
            flags.append("high_clipping_distortion")

        # FFT Power spectrum
        fft_vals = np.abs(np.fft.rfft(audio))
        freqs = np.fft.rfftfreq(len(audio), d=1.0/sr)

        # High frequency content (> 4000 Hz)
        hf_mask = freqs > 4000
        total_power = np.sum(fft_vals) + 1e-9
        hf_power = np.sum(fft_vals[hf_mask])
        hf_ratio = float(hf_power / total_power)

        if hf_ratio < 0.02 and sr >= 16000:
            flags.append("synthetic_high_frequency_suppression")

        # Spectral flatness: geometric mean / arithmetic mean
        psd = fft_vals**2 + 1e-12
        geom_mean = np.exp(np.mean(np.log(psd)))
        arith_mean = np.mean(psd)
        flatness = float(geom_mean / arith_mean)

        if flatness > 0.35:
            flags.append("vocoder_spectral_flatness_anomaly")

        return {
            "flatness": round(flatness, 4),
            "hf_ratio": round(hf_ratio, 4),
            "clipping": round(clipping_ratio, 4),
            "flags": flags
        }

    def detect(self, audio_bytes: bytes) -> AudioSpoofResponse:
        try:
            audio, sr = load_and_preprocess_audio(audio_bytes, target_sr=16000)
        except Exception as e:
            return AudioSpoofResponse(
                status="failed",
                prediction="uncertain",
                bonafide_probability=0.0,
                spoof_probability=0.0,
                spectral_flatness=0.0,
                high_freq_ratio=0.0,
                clipping_ratio=0.0,
                anomaly_flags=["audio_decode_failed"],
                message=f"Audio processing failure: {str(e)}"
            )

        duration = len(audio) / sr
        if duration < 1.0:
            return AudioSpoofResponse(
                status="uncertain",
                prediction="uncertain",
                bonafide_probability=0.5,
                spoof_probability=0.5,
                spectral_flatness=0.0,
                high_freq_ratio=0.0,
                clipping_ratio=0.0,
                anomaly_flags=["insufficient_duration"],
                message="Audio sample is too brief to reliably evaluate acoustic authenticity."
            )

        anomalies = self.analyze_acoustic_anomalies(audio, sr)

        # Extract 64-bin spectrogram over 128 frames for CNN [1, 1, 64, 128]
        _, _, Zxx = signal.stft(audio, fs=sr, nperseg=256, noverlap=128)
        spec = np.abs(Zxx[:64, :])
        if spec.shape[1] < 128:
            spec = np.pad(spec, ((0, 0), (0, 128 - spec.shape[1])), mode='reflect')
        else:
            spec = spec[:, :128]

        # Log and normalize
        log_spec = np.log(spec + 1e-6)
        norm_spec = (log_spec - np.mean(log_spec)) / (np.std(log_spec) + 1e-6)
        input_tensor = norm_spec[np.newaxis, np.newaxis, ...].astype(np.float32)  # [1, 1, 64, 128]

        outputs = self.session.run(None, {self.input_name: input_tensor})
        probabilities = outputs[0][0]  # [bonafide, spoof]
        model_bonafide = float(probabilities[0])
        model_spoof = float(probabilities[1])

        # Calibration with acoustic indicators
        penalty = len(anomalies["flags"]) * 0.20
        calibrated_bonafide = max(0.01, min(0.99, model_bonafide - penalty))
        calibrated_spoof = 1.0 - calibrated_bonafide

        if calibrated_spoof > 0.65:
            prediction = "spoof"
            msg = "Acoustic spoofing or synthetic voice clone characteristics detected."
        elif calibrated_bonafide >= 0.60:
            prediction = "bonafide"
            msg = "Organic human vocal presentation verified."
        else:
            prediction = "uncertain"
            msg = "Inconclusive acoustic signals; review or retry recommended."

        return AudioSpoofResponse(
            status="completed",
            prediction=prediction,
            bonafide_probability=round(calibrated_bonafide, 4),
            spoof_probability=round(calibrated_spoof, 4),
            spectral_flatness=anomalies["flatness"],
            high_freq_ratio=anomalies["hf_ratio"],
            clipping_ratio=anomalies["clipping"],
            anomaly_flags=anomalies["flags"],
            message=msg
        )
