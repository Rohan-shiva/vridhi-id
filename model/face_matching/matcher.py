import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import Optional, Tuple
from model.common.schemas import FaceMatchResponse

class FaceMatcher:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "weights", "face_matcher_mobilefacenet.onnx")
        
        self.model_path = model_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Face matcher model weights missing at {model_path}")
            
        opts = ort.SessionOptions()
        opts.inter_op_num_threads = 2
        opts.intra_op_num_threads = 2
        self.session = ort.InferenceSession(model_path, sess_options=opts, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def extract_embedding(self, image_bytes: bytes) -> Tuple[Optional[np.ndarray], Optional[str]]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            return None, "Invalid image format"

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
        
        if len(faces) == 0:
            # Fallback: if cascade missed in close portrait, use center crop
            h, w = img_bgr.shape[:2]
            cx, cy = w // 2, h // 2
            sz = min(w, h) // 2
            face_crop = img_bgr[max(0, cy - sz):min(h, cy + sz), max(0, cx - sz):min(w, cx + sz)]
        else:
            face_box = max(faces, key=lambda b: b[2] * b[3])
            x, y, w, h = face_box
            face_crop = img_bgr[y:y+h, x:x+w]

        face_resized = cv2.resize(face_crop, (112, 112))
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        norm_face = (face_rgb - 0.5) / 0.5
        input_tensor = np.transpose(norm_face, (2, 0, 1))[np.newaxis, ...]  # [1, 3, 112, 112]

        outputs = self.session.run(None, {self.input_name: input_tensor})
        embedding = outputs[0][0]  # shape [128]
        norm = np.linalg.norm(embedding)
        if norm > 1e-6:
            embedding = embedding / norm
        return embedding, None

    def match(self, live_image_bytes: bytes, reference_image_bytes: bytes, threshold: float = 0.60) -> FaceMatchResponse:
        live_emb, err_live = self.extract_embedding(live_image_bytes)
        if live_emb is None:
            return FaceMatchResponse(
                status="failed",
                matched=False,
                similarity_score=0.0,
                threshold=threshold,
                message=f"Live image processing error: {err_live}"
            )

        ref_emb, err_ref = self.extract_embedding(reference_image_bytes)
        if ref_emb is None:
            return FaceMatchResponse(
                status="failed",
                matched=False,
                similarity_score=0.0,
                threshold=threshold,
                message=f"Reference record image error: {err_ref}"
            )

        # Cosine similarity
        similarity = float(np.dot(live_emb, ref_emb))
        similarity = max(-1.0, min(1.0, similarity))
        matched = bool(similarity >= threshold)

        msg = "Biometric face match verified successfully." if matched else "Face similarity below matching threshold."

        return FaceMatchResponse(
            status="completed",
            matched=matched,
            similarity_score=round(similarity, 4),
            threshold=threshold,
            message=msg
        )
