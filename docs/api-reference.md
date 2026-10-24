# Vridhi-ID API Reference Specification

All backend endpoints are prefixed with `/api/v1`.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /auth/request-otp`
Requests a cryptographically secure 6-digit OTP sent to the pensioner's mobile number.
- **Request Body**:
  ```json
  { "mobile": "9876543210" }
  ```
- **Responses**:
  - `200 OK`: `{ "success": true, "message": "...", "cooldownSeconds": 60, "testOtp": "123456" }`
  - `429 Too Many Requests`: Cooldown active.
  - `400 Bad Request`: Invalid mobile format.

### `POST /auth/verify-otp`
Validates the submitted OTP and generates a signed 24h JWT session token.
- **Request Body**:
  ```json
  { "mobile": "9876543210", "otp": "592817", "language": "hi" }
  ```
- **Responses**:
  - `200 OK`: Returns JWT `token` and `user` profile (`id`, `mobile`, `role`, `languagePreference`).
  - `401 Unauthorized`: Invalid or expired OTP.

### `GET /auth/me`
Retrieves the authenticated user's current session profile.
- **Headers**: `Authorization: Bearer <token>`

### `PATCH /auth/language`
Persists the user's preferred application language.
- **Request Body**: `{ "language": "kn" }`

---

## 2. Pension Application Endpoints (`/api/v1/applications`)

### `POST /applications`
Registers a new Digital Life Certificate application.
- **Request Body**:
  ```json
  {
    "pensionerName": "Narayan Murthy",
    "ppoNumber": "PPO-2026-KA-44910",
    "dateOfBirth": "1946-08-20",
    "pensionAuthority": "Central Pension Accounting Office (CPAO)",
    "disbursingAgency": "Canara Bank",
    "accountNumber": "0192837465",
    "consentGiven": true
  }
  ```

### `GET /applications`
Lists applications filed by the authenticated user along with current status and issued certificates.

---

## 3. Biometric Verification Endpoints (`/api/v1/verification`)

### `POST /verification/session`
Initiates a single-use verification challenge session.
- **Request Body**: `{ "applicationId": "app-..." }`
- **Response**: Returns `sessionId` and `challenge` instructions (`turn_left`, `turn_right`, `nod_up`).

### `POST /verification/session/:sessionId/biometrics`
Accepts multipart files and coordinates multi-model inference:
- `live_image`: Live camera frame (JPEG).
- `reference_image`: Enrolled pension/Aadhaar portrait (JPEG).
- `challenge_image`: Frame after completing active gesture (JPEG).
- `live_audio`: Microphone voice recording (WAV).
- `reference_audio`: Enrolled voice template (WAV).
- **Response**: Returns Multi-Signal Risk Assessment outcome (`checks_passed`, `manual_review`, `suspected_spoof`), risk score (0-100), and issued certificate ID if passed.

---

## 4. Certificate Endpoints (`/api/v1/certificates`)

### `GET /certificates/application/:applicationId`
Retrieves certificate metadata.

### `GET /certificates/application/:applicationId/download`
Streams the generated Digital Life Certificate PDF binary (`application/pdf`).

---

## 5. Officer Review Portal Endpoints (`/api/v1/officer`)
*Protected by `requireRole(['officer', 'admin'])`*

### `GET /officer/queue`
Returns all applications under review or pending adjudication.

### `GET /officer/case/:id`
Retrieves comprehensive case details and AI model inference metrics.

### `POST /officer/case/:id/review`
Submits an officer adjudication:
- **Request Body**:
  ```json
  {
    "decision": "approved", // approved | rejected | needs_correction
    "reason": "Biometric signals verified authentic after officer review."
  }
  ```
