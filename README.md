# Vridhi-ID (वृद्धि-ID)
### Accessible, Voice-First, Multilingual Digital Life Certificate Assistance Platform

Vridhi-ID is an assistive platform engineered specifically for elderly pensioners, citizens with limited literacy, and individuals navigating digital government services. It facilitates the Digital Life Certificate (DLC / Jeevan Pramaan assistance) workflow using localized voice guidance, accessible touch interfaces, real AI presentation attack detection (PAD), face matching, speaker verification, active biometric challenge-response, and human officer review queues.

---

## 🏛️ System Architecture

The platform is strictly decoupled into three core tiers:

```
Vridhi-ID/
├── frontend/             # React 18 + TypeScript + Vite + Tailwind CSS + i18next + Web Speech
├── backend/              # Node.js + Express + TypeScript + MongoDB / In-Memory Store + JWT Auth
├── model/                # Python FastAPI + ONNX Runtime + OpenCV + Audio Signal Processing
├── docs/                 # Architecture, API specifications, model docs & security guides
├── scripts/              # Validation scripts, seed tools, and smoke tests
└── docker-compose.yml    # Multi-service container orchestration
```

### Key Capabilities

1. **Mandatory Hindi-First Welcome Experience**:
   - Opens immediately in Hindi with both visual greeting and spoken Text-to-Speech (TTS).
   - Prompts for language selection ("क्या आप भाषा बदलना चाहते हैं?").
   - Supports 11 Indian languages: Hindi (हिन्दी), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), Malayalam (മലയാളം), Odia (ଓଡ଼ିଆ), and English.
2. **Dual Voice & Manual Navigation**:
   - Voice-first dialogue state machine with speech recognition and natural language intent classification.
   - 100% accessible touch and keyboard fallback for every single workflow.
3. **Multi-Model Biometric Verification**:
   - **Face Presentation Attack Detection (PAD)**: Deep CNN / ONNX model evaluating replay, print attack, and screen reflections.
   - **Face Matching**: Cosine similarity against enrolled Aadhaar/Pension reference face embeddings.
   - **Speaker Verification**: Deep acoustic embedding comparison against enrolled voice templates.
   - **Audio Spoof & Deepfake Detection**: Acoustic spectral anomaly analysis detecting synthetic voices and replay.
   - **Active Biometric Challenge**: Random challenge gestures (head turn, smile, gaze shifts).
4. **Combined Risk Engine**:
   - Multi-signal decision matrix (`checks_passed`, `manual_review`, `retry_required`, `suspected_spoof`).
   - Replay protection with nonce-based challenge tokens.
5. **Officer Review Portal**:
   - Role-protected review queue for cases flagged for manual scrutiny.
   - Comprehensive audit trails and reason capture.
6. **Government Integration Boundary**:
   - Clearly documented interface for official Jeevan Pramaan / UIDAI gateway adapters.
   - Internal demonstration workflow with watermarked demo records; never misrepresents demo outputs as official government documents.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ (tested on Node v24)
- Python 3.10+ (tested on Python 3.13)
- npm v9+

### 1. Python AI Model Service
```bash
cd model
pip install -r requirements.txt
python -m api.server
# Model service runs on http://localhost:8000
```

### 2. Backend API Service
```bash
cd backend
npm install
npm run dev
# Backend service runs on http://localhost:5000
```

### 3. Frontend Web Application
```bash
cd frontend
npm install
npm run dev
# Accessible portal opens at http://localhost:3000
```

---

## 🔒 Security & Privacy Notice
Vridhi-ID does not store unencrypted raw biometrics. All verification passes through short-lived challenge sessions with strict cryptographic validation. Please refer to `docs/security-and-privacy.md` for our zero-trust data protection policy.
