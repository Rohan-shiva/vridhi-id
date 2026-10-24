# Vridhi-ID Local Setup & Deployment Guide

This guide details the step-by-step instructions to run and deploy Vridhi-ID locally or via Docker.

---

## 1. Prerequisites

- **Node.js**: v18+ (tested on Node v24)
- **Python**: v3.10+ (tested on Python v3.13)
- **npm**: v9+
- **Docker & Docker Compose** (Optional, for containerized deployment)

---

## 2. Local Setup (Without Docker)

### Step 1: AI Model Service (Python)
```bash
cd model
pip install -r requirements.txt
python scripts/init_models.py
pytest tests -v
uvicorn api.server:app --host 0.0.0.0 --port 8000
```
*Model service starts at `http://localhost:8000`.*

### Step 2: Backend REST Service (Node.js)
```bash
cd backend
npm install
# Copy environment file
cp .env.example .env
# Run automated tests
npm test
# Start dev server
npm run dev
```
*Backend service starts at `http://localhost:5000`.*

### Step 3: Frontend Web Portal (React + Vite)
```bash
cd frontend
npm install
# Copy environment file
cp .env.example .env
# Run translation parity tests
npm test
# Start dev server
npm run dev
```
*Frontend opens at `http://localhost:3000`.*

---

## 3. Automated End-to-End Smoke Test

Run the full end-to-end integration test suite while the services are active:
```bash
python scripts/smoke_test.py
```
This script exercises:
1. Health checks on Model Service & Backend.
2. OTP dispatch & bcrypt verification.
3. Pension application creation.
4. Active biometric challenge issuance.
5. Real Face PAD, Face Match, and Voice evaluation.
6. Combined Risk Engine decision.
7. PDF Certificate generation.
8. Officer Review queue inspection and adjudication.

---

## 4. Docker Compose Deployment

To orchestrate all services via Docker:
```bash
docker-compose up --build
```
This boots:
- `mongodb` on port `27017`
- `model-service` on port `8000`
- `backend` on port `5000`
- `frontend` on port `3000`
