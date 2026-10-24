# Vridhi-ID AI Model & Risk Engine Documentation

This document describes the machine learning architectures, pretrained weights, signal processing pipelines, and calibration thresholds utilized in Vridhi-ID.

---

## 1. Face Presentation Attack Detection (Face PAD)

- **Model Identifier**: `face_pad_minifasnet`
- **Architecture**: Lightweight deep convolutional network (MiniFASNet) combined with 2D Fast Fourier Transform (FFT) high-frequency analysis and YCrCb color space chromatic variance.
- **Inference Pipeline**:
  1. Haar cascade detects face coordinates; crops and expands bounding box by 10%.
  2. Image quality assessment evaluates Laplacian variance for sharpness (`is_sharp > 45.0`) and HSV Value channel for lighting (`0.20 <= brightness <= 0.88`).
  3. 2D FFT extracts high-frequency annular spectral energy to identify print rasters or mobile screen pixel lattices.
  4. Preprocessed normalized tensor `[1, 3, 80, 80]` is evaluated via ONNX Runtime CPU execution provider.
  5. Calibrated score outputs `live_probability` and `spoof_probability`.
- **Decision Threshold**: `0.60` (live if `live_probability >= 0.60` and image quality checks pass).

---

## 2. Face Recognition & Matching

- **Model Identifier**: `mobilefacenet_arcface`
- **Architecture**: MobileFaceNet deep convolutional network mapping aligned 112x112 face portraits into 128-dimensional L2-normalized embeddings.
- **Inference Pipeline**:
  1. Extracts 128-dim embedding $\vec{e}_{live}$ from the query frame.
  2. Extracts 128-dim embedding $\vec{e}_{ref}$ from the enrolled reference portrait.
  3. Computes Cosine Similarity:
     $$\text{Similarity} = \frac{\vec{e}_{live} \cdot \vec{e}_{ref}}{\|\vec{e}_{live}\|_2 \|\vec{e}_{ref}\|_2}$$
- **Decision Threshold**: `0.60` for automated biometric matching.

---

## 3. Speaker Verification

- **Model Identifier**: `speaker_ecapa_acoustic`
- **Architecture**: ECAPA-TDNN acoustic feature projector processing 80-channel Log-Mel spectrograms into 192-dimensional speaker embeddings.
- **Inference Pipeline**:
  1. Loads audio, normalizes sample rate to 16 kHz mono.
  2. Computes duration, RMS energy, and Signal-to-Noise Ratio (SNR). Rejects recordings shorter than 1.5 seconds.
  3. Extracts 80-channel Log-Mel filterbank over 100 frames `[1, 80, 100]`.
  4. Runs ONNX inference to generate 192-dim normalized embedding.
  5. Computes cosine similarity against enrolled vocal template.
- **Decision Threshold**: `0.68`.

---

## 4. Audio Deepfake & Spoof Detection

- **Model Identifier**: `audio_spectral_antispoof`
- **Architecture**: Spectral CNN classifier combined with acoustic physical feature extraction (spectral flatness, high-frequency cutoff, amplitude clipping ratio).
- **Inference Pipeline**:
  1. Detects high-frequency dropoffs characteristic of synthetic text-to-speech vocoders ($>4 \text{ kHz}$).
  2. Computes spectral flatness ratio to detect robotic, synthetic harmonics.
  3. Normalizes 64-bin spectrogram into shape `[1, 1, 64, 128]` for CNN inference.
  4. Returns `bonafide_probability` and `spoof_probability` with granular anomaly flags.
- **Decision Threshold**: Spoof if `spoof_probability > 0.65`.

---

## 5. Active Biometric Challenge-Response

- **Mechanism**: Dynamic, server-issued single-use gesture tokens (`turn_left`, `turn_right`, `nod_up`) with 60-second TTL.
- **Verification**: Evaluates optical displacement vectors between the baseline frame and challenge frame using dense Farneback optical flow.
- **Purpose**: Eliminates pre-recorded video replays.

---

## 6. Multi-Signal Risk Assessment Decision Matrix

The combined risk engine evaluates independent signals without arbitrary arithmetic averaging:

| Face PAD | Face Match | Active Challenge | Voice Signals | Engine Outcome | Next Workflow Action |
|:---|:---|:---|:---|:---|:---|
| Live | $\ge 0.60$ | Passed | Bonafide | `checks_passed` | Auto-issue Digital Life Certificate |
| Live | $0.50 - 0.59$ | Passed | Inconclusive | `manual_review` | Forward to Human Officer Portal |
| Spoof | Any | Any | Any | `suspected_spoof` | Reject application with attack flag |
| Live | $\ge 0.60$ | Failed | Any | `manual_review` | Human review required |
| Blurry / Dim | Any | Any | Any | `retry_required` | Prompt user to adjust camera / light |
