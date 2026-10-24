# Vridhi-ID AI Model Inference Service

High-performance, multimodal biometric authentication and anti-spoofing microservice implemented with FastAPI, ONNX Runtime, and OpenCV.

## Capabilities

1. **Face Presentation Attack Detection (PAD)**
   - Architecture: MiniFASNet deep convolutional feature extractor + Multi-spectral texture & FFT frequency analysis.
   - Outputs: `live_probability`, `spoof_probability`, image sharpness variance, brightness score, and binary prediction (`live` / `spoof` / `uncertain`).
2. **Face Recognition & Verification**
   - Architecture: MobileFaceNet / ArcFace mapping to 128-dimensional L2-normalized embeddings.
   - Outputs: Cosine similarity score and match decision against enrolled biometric record.
3. **Speaker Verification**
   - Architecture: ECAPA-TDNN acoustic feature projector over 80-bin Log-Mel filterbanks to 192-dimensional embeddings.
   - Outputs: Vocal similarity score, duration, RMS energy, and SNR estimation.
4. **Audio Deepfake & Synthetic Voice Detection**
   - Architecture: Spectral CNN classifier coupled with physical acoustic anomaly detectors (high frequency cutoff, spectral flatness, clipping ratio).
   - Outputs: Bonafide vs spoof probability with granular anomaly flags.
5. **Active Biometric Challenge-Response**
   - Cryptographically short-lived, single-use active challenge evaluation (head turn, tilt) using dense optical displacement vectors to eliminate video replay attacks.

## Setup & Running

```bash
# Install dependencies
pip install -r requirements.txt

# Generate / verify model weights
python scripts/init_models.py

# Run test suite
pytest tests -v

# Start FastAPI server
uvicorn api.server:app --host 0.0.0.0 --port 8000
```
