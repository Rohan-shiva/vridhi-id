import io
import numpy as np
import soundfile as sf
from scipy import signal
from typing import Tuple, Dict, Any

def load_and_preprocess_audio(audio_bytes: bytes, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
    """Loads arbitrary audio bytes and converts to single-channel float32 at target_sr."""
    try:
        data, sr = sf.read(io.BytesIO(audio_bytes))
    except Exception as e:
        # If soundfile fails, try raw 16-bit PCM fallback
        try:
            pcm = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            data = pcm
            sr = target_sr
        except Exception:
            raise ValueError(f"Unable to decode audio: {e}")

    # If multi-channel, average to mono
    if data.ndim > 1:
        data = np.mean(data, axis=1)

    # Resample if necessary
    if sr != target_sr and len(data) > 0:
        num_samples = int(len(data) * target_sr / sr)
        data = signal.resample(data, num_samples)
        sr = target_sr

    # Ensure float32 in [-1.0, 1.0]
    data = np.clip(data.astype(np.float32), -1.0, 1.0)
    return data, sr

def compute_audio_quality(audio: np.ndarray, sr: int) -> Dict[str, Any]:
    duration = float(len(audio)) / float(sr) if sr > 0 else 0.0
    rms = float(np.sqrt(np.mean(audio**2))) if len(audio) > 0 else 0.0
    
    # Estimate noise floor from lowest 10% energy frames
    frame_size = int(sr * 0.025)
    hop_size = int(sr * 0.010)
    if len(audio) > frame_size:
        frames = [audio[i:i+frame_size] for i in range(0, len(audio) - frame_size, hop_size)]
        frame_energies = [np.sum(f**2) for f in frames]
        frame_energies.sort()
        noise_energy = np.mean(frame_energies[:max(1, len(frame_energies)//10)]) + 1e-9
        signal_energy = np.mean(frame_energies[len(frame_energies)//2:]) + 1e-9
        snr_db = float(10 * np.log10(signal_energy / noise_energy))
    else:
        snr_db = 15.0

    return {
        "duration_seconds": round(duration, 2),
        "sample_rate": sr,
        "rms_energy": round(rms, 4),
        "snr_estimate_db": round(max(0.0, min(50.0, snr_db)), 1),
        "is_sufficient_length": duration >= 1.5
    }

def compute_mel_spectrogram(audio: np.ndarray, sr: int = 16000, n_mels: int = 80, n_fft: int = 512, hop_length: int = 160) -> np.ndarray:
    """Computes standard 80-bin Log-Mel Spectrogram."""
    if len(audio) < n_fft:
        audio = np.pad(audio, (0, n_fft - len(audio)))

    # STFT
    frequencies, times, Zxx = signal.stft(audio, fs=sr, nperseg=n_fft, noverlap=n_fft - hop_length)
    power_spec = np.abs(Zxx)**2

    # Mel filterbank
    mel_filters = create_mel_filterbank(sr=sr, n_fft=n_fft, n_mels=n_mels)
    mel_spec = np.dot(mel_filters, power_spec)
    log_mel = np.log(mel_spec + 1e-6)
    return log_mel

def hz_to_mel(hz):
    return 2595 * np.log10(1 + hz / 700.0)

def mel_to_hz(mel):
    return 700 * (10**(mel / 2595.0) - 1)

def create_mel_filterbank(sr: int, n_fft: int, n_mels: int) -> np.ndarray:
    low_freq = 0
    high_freq = sr / 2
    low_mel = hz_to_mel(low_freq)
    high_mel = hz_to_mel(high_freq)
    
    mel_points = np.linspace(low_mel, high_mel, n_mels + 2)
    hz_points = mel_to_hz(mel_points)
    bin_points = np.floor((n_fft + 1) * hz_points / sr).astype(int)

    filterbank = np.zeros((n_mels, n_fft // 2 + 1))
    for i in range(1, n_mels + 1):
        left = bin_points[i - 1]
        center = bin_points[i]
        right = bin_points[i + 1]

        for j in range(left, center):
            if center != left:
                filterbank[i - 1, j] = (j - left) / (center - left)
        for j in range(center, right):
            if right != center:
                filterbank[i - 1, j] = (right - j) / (right - center)

    return filterbank
