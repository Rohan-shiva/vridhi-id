# Vridhi-ID System Architecture

Vridhi-ID (वृद्धि-ID) is engineered as an accessible, voice-first, multi-tier Digital Life Certificate (DLC) assistance platform designed for senior citizens, individuals with limited literacy, and users facing barriers with conventional digital government services.

---

## 🏛️ Architecture Overview

The system strictly decouples the client user interface, the business rules and state management engine, and the heavy AI machine learning inference pipelines into three dedicated micro-architectures:

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  React 18 + Vite + TypeScript + Tailwind CSS + i18next + Web Speech API         |
|                                                                                 |
|  - Hindi-First Automatic Spoken Welcome Experience                             |
|  - 11 Indian Target Languages with 100% Translation Parity                      |
|  - Dual Voice Dialogue State Machine & Accessible Touch / Keyboard Fallback     |
|  - Real Camera Video Stream & Microphone Audio MediaRecorder Capture           |
+---------------------------------------------------------------------------------+
                                       |
                     HTTPS / JSON REST | Multipart / Form-Data
                                       v
+---------------------------------------------------------------------------------+
|                                 BACKEND TIER                                    |
|  Node.js + Express + TypeScript + Mongoose / In-Memory Resilient Fallback       |
|                                                                                 |
|  - Cryptographic 6-digit OTP Lifecycle (Bcrypt, TTL, Rate-Limiting, Cooldown)   |
|  - Role-Based Access Control (Pensioner, Officer, Admin)                       |
|  - Pension Application State Machine (Draft, Pending, Under Review, Approved)  |
|  - Multi-Signal Risk Assessment Engine                                          |
|  - Digital Life Certificate PDF Generation (PDFKit with Demo Watermarking)      |
|  - Human Officer Review Queue & Case Adjudication                               |
+---------------------------------------------------------------------------------+
                                       |
                   Internal HTTP / JSON | Multipart Biometrics
                                       v
+---------------------------------------------------------------------------------+
|                               AI MODEL SERVICE                                  |
|  Python 3 + FastAPI + ONNX Runtime + OpenCV + Scipy Signal Processing           |
|                                                                                 |
|  - Face Presentation Attack Detection (MiniFASNet ONNX + 2D FFT Frequency)      |
|  - Face Recognition & Cosine Matching (MobileFaceNet / ArcFace ONNX)            |
|  - Speaker Verification (ECAPA-TDNN Acoustic 80-bin Mel Filterbank ONNX)        |
|  - Audio Spoof & Synthetic Voice Detection (Spectral CNN + Acoustic Flatness)   |
|  - Nonce-Based Short-Lived Active Challenge Verification (Optical Displacement) |
+---------------------------------------------------------------------------------+
```

---

## 🔒 Government Integration Boundary

In accordance with Section 15 of the specifications:
- Vridhi-ID is explicitly designed as an **assistive workflow interface** that simplifies biometric verification for elderly citizens.
- It does **not** falsely claim direct integration with Jeevan Pramaan, UIDAI, or statutory pension sanction authorities without prior formal accreditation.
- All documents produced within this prototype carry clear, prominent demonstration notices and verification hashes, preventing any misrepresentation as statutory government documents.
- The backend architecture exposes clean adapter interfaces ready to connect to authorized Jeevan Pramaan / UIDAI gateway APIs once statutory production keys are granted.
