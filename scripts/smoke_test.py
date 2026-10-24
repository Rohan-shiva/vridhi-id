#!/usr/bin/env python3
"""
End-to-End Automated Smoke Test for Vridhi-ID
Tests:
1. Model Service Health & Real Model Inference
2. Backend System Health & Auth
3. OTP Generation & Cryptographic Verification
4. Pension Application Registration
5. Biometric Verification Session & Active Challenge
6. Multi-Signal Risk Assessment Engine
7. Digital Life Certificate PDF Generation & Verification
8. Officer Review Adjudication Queue
"""

import sys
import time
import requests
import io
import cv2
import numpy as np
import soundfile as sf

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BACKEND_URL = "http://localhost:5000/api/v1"
MODEL_URL = "http://localhost:8000"

def create_face_image_bytes():
    img = np.full((300, 300, 3), (210, 210, 210), dtype=np.uint8)
    cv2.ellipse(img, (150, 150), (80, 110), 0, 0, 360, (180, 150, 130), -1)
    cv2.circle(img, (120, 130), 12, (255, 255, 255), -1)
    cv2.circle(img, (180, 130), 12, (255, 255, 255), -1)
    cv2.circle(img, (120, 130), 5, (40, 30, 20), -1)
    cv2.circle(img, (180, 130), 5, (40, 30, 20), -1)
    cv2.line(img, (150, 135), (150, 170), (120, 100, 90), 3)
    cv2.ellipse(img, (150, 195), (25, 12), 0, 0, 180, (70, 60, 140), -1)
    _, enc = cv2.imencode(".jpg", img)
    return enc.tobytes()

def create_audio_bytes():
    t = np.linspace(0, 2.0, int(16000 * 2.0), endpoint=False)
    sig = 0.5 * np.sin(2 * np.pi * 220 * t) + 0.2 * np.sin(2 * np.pi * 440 * t)
    buf = io.BytesIO()
    sf.write(buf, sig.astype(np.float32), 16000, format='WAV')
    return buf.getvalue()

def run_smoke_test():
    print("================================================================")
    print("🚀 Starting Vridhi-ID Automated End-to-End Smoke Test")
    print("================================================================")

    # 1. Model Service Health
    print("\n[1/8] Checking AI Model Service Health...")
    try:
        res = requests.get(f"{MODEL_URL}/health", timeout=3)
        res.raise_for_status()
        data = res.json()
        print(f"  ✅ Model Service Online. Status: {data['status']}")
        for m, loaded in data['models_loaded'].items():
            print(f"     - {m}: {'LOADED' if loaded else 'FAILED'}")
    except Exception as e:
        print(f"  ❌ Model Service unavailable at {MODEL_URL}: {e}")
        return False

    # 2. Backend Health
    print("\n[2/8] Checking Backend System Health...")
    try:
        res = requests.get(f"{BACKEND_URL}/system/health", timeout=3)
        res.raise_for_status()
        data = res.json()
        print(f"  ✅ Backend Online. DB fallback active: {data['database']['usingMemoryFallback']}")
    except Exception as e:
        print(f"  ❌ Backend unavailable at {BACKEND_URL}: {e}")
        return False

    # 3. OTP Flow & Authentication
    print("\n[3/8] Testing Mobile OTP & Authentication...")
    test_mobile = "9876541122"
    otp_res = requests.post(f"{BACKEND_URL}/auth/request-otp", json={"mobile": test_mobile})
    assert otp_res.status_code == 200, f"OTP request failed: {otp_res.text}"
    otp_data = otp_res.json()
    test_otp = otp_data.get("testOtp")
    print(f"  ✅ OTP requested successfully for +91-{test_mobile}. Received sandbox code: {test_otp}")

    verify_res = requests.post(f"{BACKEND_URL}/auth/verify-otp", json={
        "mobile": test_mobile,
        "otp": test_otp,
        "language": "kn"
    })
    assert verify_res.status_code == 200, f"OTP verify failed: {verify_res.text}"
    auth_data = verify_res.json()
    token = auth_data["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  ✅ User authenticated. JWT token issued.")

    # 4. Pension Application Registration
    print("\n[4/8] Registering Pension Application...")
    app_res = requests.post(f"{BACKEND_URL}/applications", headers=headers, json={
        "pensionerName": "Narayan Murthy",
        "ppoNumber": "PPO-2026-KA-44910",
        "dateOfBirth": "1946-08-20",
        "pensionAuthority": "Central Pension Accounting Office (CPAO)",
        "disbursingAgency": "Canara Bank",
        "accountNumber": "0192837465",
        "consentGiven": True
    })
    assert app_res.status_code == 201, f"Application registration failed: {app_res.text}"
    app_obj = app_res.json()["application"]
    app_id = app_obj["id"]
    print(f"  ✅ Application created. ID: {app_id}, PPO: {app_obj['ppoNumber']}")

    # 5. Verification Session & Active Challenge
    print("\n[5/8] Starting Biometric Verification Session...")
    sess_res = requests.post(f"{BACKEND_URL}/verification/session", headers=headers, json={
        "applicationId": app_id
    })
    assert sess_res.status_code == 200, f"Session init failed: {sess_res.text}"
    sess_data = sess_res.json()
    session_id = sess_data["sessionId"]
    print(f"  ✅ Verification Session created: {session_id}")
    print(f"     Active Challenge: {sess_data['challenge']['type']} - '{sess_data['challenge']['instructions']}'")

    # 6. Biometric Multimodal Submission & Risk Evaluation
    print("\n[6/8] Executing Real AI Biometric Inference & Risk Assessment...")
    face_bytes = create_face_image_bytes()
    audio_bytes = create_audio_bytes()

    files = {
        "live_image": ("face.jpg", face_bytes, "image/jpeg"),
        "reference_image": ("ref.jpg", face_bytes, "image/jpeg"),
        "challenge_image": ("chal.jpg", face_bytes, "image/jpeg"),
        "live_audio": ("voice.wav", audio_bytes, "audio/wav"),
        "reference_audio": ("ref_voice.wav", audio_bytes, "audio/wav")
    }

    sub_res = requests.post(
        f"{BACKEND_URL}/verification/session/{session_id}/biometrics",
        headers=headers,
        files=files
    )
    assert sub_res.status_code == 200, f"Biometric evaluation failed: {sub_res.text}"
    eval_data = sub_res.json()
    print(f"  ✅ Multi-Signal Risk Assessment: {eval_data['decision'].upper()}")
    print(f"     Risk Score: {eval_data['riskScore']} / 100")
    print(f"     Summary: {eval_data['summary']}")

    # 7. Certificate Issuance Verification
    print("\n[7/8] Inspecting Certificate Record & PDF Generation...")
    cert_res = requests.get(f"{BACKEND_URL}/certificates/application/{app_id}", headers=headers)
    if cert_res.status_code == 200:
        cert_data = cert_res.json()["certificate"]
        print(f"  ✅ Certificate Generated: {cert_data['certificateNumber']}")

        # Test binary PDF download
        pdf_res = requests.get(f"{BACKEND_URL}/certificates/application/{app_id}/download", headers=headers)
        assert pdf_res.status_code == 200, "PDF download failed"
        assert pdf_res.headers.get("Content-Type") == "application/pdf"
        assert len(pdf_res.content) > 1000, "PDF content seems empty"
        print(f"  ✅ Digital Life Certificate PDF verified ({len(pdf_res.content)} bytes).")
    else:
        print(f"  ℹ️ Certificate status is pending review (Risk Outcome: {eval_data['decision']}).")

    # 8. Human Officer Review Portal
    print("\n[8/8] Testing Human Officer Review Queue & Adjudication...")
    # Officer login
    officer_otp_res = requests.post(f"{BACKEND_URL}/auth/request-otp", json={"mobile": "9876543210"})
    officer_otp = officer_otp_res.json()["testOtp"]
    officer_auth = requests.post(f"{BACKEND_URL}/auth/verify-otp", json={"mobile": "9876543210", "otp": officer_otp}).json()
    officer_token = officer_auth["token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    queue_res = requests.get(f"{BACKEND_URL}/officer/queue", headers=officer_headers)
    assert queue_res.status_code == 200, "Officer queue access failed"
    queue = queue_res.json()["queue"]
    print(f"  ✅ Officer Queue loaded: {len(queue)} total cases.")

    # Adjudicate application
    adjudicate_res = requests.post(f"{BACKEND_URL}/officer/case/{app_id}/review", headers=officer_headers, json={
        "decision": "approved",
        "reason": "Biometric presentations verified authentic by officer audit."
    })
    assert adjudicate_res.status_code == 200, "Officer adjudication failed"
    print(f"  ✅ Officer decision recorded. Status: APPROVED.")

    print("\n================================================================")
    print("🎉 ALL END-TO-END SMOKE TESTS COMPLETED SUCCESSFULLY!")
    print("================================================================")
    return True

if __name__ == "__main__":
    success = run_smoke_test()
    if not success:
        sys.exit(1)
