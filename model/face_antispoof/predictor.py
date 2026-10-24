import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import Tuple, Dict, Any, Optional
from model.common.schemas import FacePadResponse, ImageQualityMetrics

class FaceAntiSpoofPredictor:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights", "face_pad_minifasnet.onnx")
        
        self.model_path = model_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"PAD model weights missing at {model_path}")
            
        opts = ort.SessionOptions()
        opts.inter_op_num_threads = 2
        opts.intra_op_num_threads = 2
        self.session = ort.InferenceSession(model_path, sess_options=opts, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def assess_quality(self, img_bgr: np.ndarray, face_box: Optional[Tuple[int, int, int, int]]) -> ImageQualityMetrics:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Sharpness via Laplacian variance
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_sharp = sharpness > 45.0  # Threshold for adequate focus
        
        # Lighting / Brightness via HSV Value channel
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        v_channel = hsv[:, :, 2]
        brightness = float(np.mean(v_channel)) / 255.0
        is_adequately_lit = 0.20 <= brightness <= 0.88
        
        face_detected = face_box is not None
        
        return ImageQualityMetrics(
            face_detected=face_detected,
            brightness_score=round(brightness, 3),
            sharpness_score=round(sharpness, 2),
            is_adequately_lit=is_adequately_lit,
            is_sharp=is_sharp
        )

    def analyze_frequency_and_color(self, face_bgr: np.ndarray) -> Dict[str, float]:
        """
        Physical texture & frequency analysis:
        - Fourier transform to measure spectral decay and high-frequency energy ratio.
        - Color distribution in YCrCb to detect screen re-radiation.
        """
        gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        if h < 20 or w < 20:
            return {"high_freq_ratio": 0.5, "color_naturalness": 0.5}

        # 2D FFT
        dft = cv2.dft(np.float32(gray), flags=cv2.DFT_COMPLEX_OUTPUT)
        dft_shift = np.fft.fftshift(dft)
        magnitude_spectrum = 20 * np.log(cv2.magnitude(dft_shift[:, :, 0], dft_shift[:, :, 1]) + 1e-6)
        
        # High frequency annular mask
        cy, cx = h // 2, w // 2
        r_inner = min(h, w) // 6
        r_outer = min(h, w) // 2
        
        y, x = np.ogrid[:h, :w]
        dist_from_center = np.sqrt((x - cx)**2 + (y - cy)**2)
        high_freq_mask = (dist_from_center >= r_inner) & (dist_from_center <= r_outer)
        
        total_energy = np.sum(magnitude_spectrum) + 1e-6
        hf_energy = np.sum(magnitude_spectrum[high_freq_mask])
        hf_ratio = float(hf_energy / total_energy)
        
        # Color distribution (living skin has balanced Cr/Cb variance)
        ycrcb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2YCrCb)
        cr_std = float(np.std(ycrcb[:, :, 1]))
        cb_std = float(np.std(ycrcb[:, :, 2]))
        color_balance = min(1.0, max(0.0, 1.0 - abs(cr_std - cb_std) / 50.0))

        return {
            "high_freq_ratio": round(hf_ratio, 3),
            "color_naturalness": round(color_balance, 3)
        }

    def predict(self, image_bytes: bytes) -> FacePadResponse:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            return FacePadResponse(
                status="failed",
                prediction="uncertain",
                live_probability=0.0,
                spoof_probability=0.0,
                quality=ImageQualityMetrics(
                    face_detected=False,
                    brightness_score=0.0,
                    sharpness_score=0.0,
                    is_adequately_lit=False,
                    is_sharp=False
                ),
                message="Invalid or corrupt image format"
            )

        # Detect face
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
        
        face_box = None
        if len(faces) > 0:
            # Pick the largest face detected
            face_box = max(faces, key=lambda b: b[2] * b[3])
            
        quality = self.assess_quality(img_bgr, face_box)
        
        if not quality.face_detected:
            return FacePadResponse(
                status="uncertain",
                prediction="uncertain",
                live_probability=0.0,
                spoof_probability=0.5,
                quality=quality,
                message="No face detected. Please ensure your face is clearly visible inside the camera frame."
            )

        x, y, w, h = face_box
        # Expand box slightly (10%) to capture hair/chin boundaries
        pad_x = int(0.1 * w)
        pad_y = int(0.1 * h)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(img_bgr.shape[1], x + w + pad_x)
        y2 = min(img_bgr.shape[0], y + h + pad_y)
        face_crop = img_bgr[y1:y2, x1:x2]

        # Analyze physical characteristics
        freq_color = self.analyze_frequency_and_color(face_crop)
        
        # Preprocess for ONNX model [1, 3, 80, 80]
        face_resized = cv2.resize(face_crop, (80, 80))
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        # Normalize (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        norm_face = (face_rgb - mean) / std
        input_tensor = np.transpose(norm_face, (2, 0, 1))[np.newaxis, ...]  # [1, 3, 80, 80]

        # ONNX inference
        outputs = self.session.run(None, {self.input_name: input_tensor})
        probabilities = outputs[0][0]  # [p_spoof, p_live]
        raw_spoof_prob = float(probabilities[0])
        raw_live_prob = float(probabilities[1])

        # Combined calibration with frequency and color metrics
        # Living skin exhibits natural chromatic variance and healthy spectral distribution
        calibrated_live = 0.65 * raw_live_prob + 0.20 * freq_color["color_naturalness"] + 0.15 * min(1.0, freq_color["high_freq_ratio"] * 2.0)
        calibrated_live = max(0.01, min(0.99, calibrated_live))
        calibrated_spoof = 1.0 - calibrated_live

        decision_threshold = 0.60
        if not quality.is_sharp:
            prediction = "uncertain"
            status_msg = "Image is too blurry. Hold the camera steady."
        elif not quality.is_adequately_lit:
            prediction = "uncertain"
            status_msg = "Poor lighting. Move into a well-lit room."
        elif calibrated_live >= decision_threshold:
            prediction = "live"
            status_msg = "Live presentation verified."
        else:
            prediction = "spoof"
            status_msg = "Presentation attack or synthetic artifact detected."

        return FacePadResponse(
            status="completed",
            prediction=prediction,
            live_probability=round(calibrated_live, 4),
            spoof_probability=round(calibrated_spoof, 4),
            decision_threshold=decision_threshold,
            quality=quality,
            message=status_msg
        )
