# Vridhi-ID Backend Service

Core REST API and authentication service implemented with Node.js, Express, and TypeScript.

## Responsibilities

1. **Authentication & Mobile OTP Lifecycle**:
   - Cryptographic OTP generation and bcrypt hash storage.
   - 5-minute time-to-live (TTL), max 3 attempts limit, 60-second resend cooldown.
   - Configurable developer sandbox flag (`OTP_TEST_MODE`) without hardcoded authentication bypasses.
   - JWT sessions with role-based authorization (`pensioner`, `officer`, `admin`).
2. **Pension Application Management**:
   - Validation of PPO numbers, authorities, banking accounts, and consent capture.
3. **Multi-Signal Risk Engine**:
   - Aggregates Face PAD, Face Match, Speaker Verification, Audio Spoof, and Active Challenge signals into workflow decisions (`checks_passed`, `manual_review`, `retry_required`, `suspected_spoof`).
4. **Digital Life Certificate Issuance**:
   - PDFKit generation with clear prototype/demonstration watermarking ensuring transparency against official government claims.
5. **Officer Review Queue**:
   - Role-protected administrative dashboard for reviewing flagged cases and recording decisions.
6. **Resilient Data Persistence**:
   - Connects to real MongoDB cluster when available; automatically activates embedded in-memory persistence when running without local database daemon.

## Running Locally

```bash
npm install
npm test       # Run integration test suite
npm run dev    # Start development server with tsx watch
```
