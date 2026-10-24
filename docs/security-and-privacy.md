# Security & Privacy Policy — Vridhi-ID

Vridhi-ID treats biometric recordings and pension data with strict zero-trust data protection principles.

---

## 1. Biometric Data Handling

- **No Indefinite Raw Storage**:
  - Raw video streams and camera feeds are processed in volatile memory.
  - Verification sessions use transient multipart payloads that are evaluated in-memory and discarded.
- **Biometric Templates**:
  - Biometric templates are stored exclusively as irreversible numerical embeddings (128-dim or 192-dim vectors).
  - Embeddings cannot be reconstructed into raw human face portraits or voice audio.
- **Replay Protection**:
  - Every verification session is bound to an ephemeral, cryptographically unique challenge token with a 60-second time-to-live.
  - Re-submission of old challenge tokens is strictly rejected.

---

## 2. Authentication & Authorization Safeguards

- **Cryptographic OTPs**:
  - OTPs are generated using `crypto.randomInt` (cryptographically strong pseudo-random number generator).
  - Plaintext OTPs are never stored in databases or server logs; OTPs are hashed using bcrypt with salt rounds before saving.
  - Attempt limits: maximum 3 verification attempts per challenge.
  - Cooldown: strict 60-second cooldown between resend requests.
  - Session TTL: OTP expires automatically after 5 minutes.
- **Role-Based Access Control (RBAC)**:
  - Strict separation of duties: Pensioners can only access their own records.
  - Officer endpoints (`/api/v1/officer/*`) enforce `requireRole(['officer', 'admin'])`.
- **Rate Limiting**:
  - Express rate limiters protect authentication endpoints against brute force attempts.

---

## 3. Transparency & Non-Misrepresentation

- In accordance with Section 1.1 and 15 of the specification:
  - All demonstration certificates generated carry clear, prominent notices:
    `NOTICE: DEMONSTRATION LIFE CERTIFICATE RECORD - NOT AN OFFICIAL GOVERNMENT DOCUMENT`
  - Vridhi-ID does not pretend to hold statutory authority or forge official government signatures.
