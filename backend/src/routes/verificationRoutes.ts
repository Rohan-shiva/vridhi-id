import { Router } from 'express';
import multer from 'multer';
import { VerificationController } from '../controllers/verificationController';
import { authenticate } from '../middleware/authMiddleware';

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  storage: multer.memoryStorage()
});

const router = Router();

router.use(authenticate);

router.post('/session', VerificationController.startSession);
router.post(
  '/session/:sessionId/biometrics',
  upload.fields([
    { name: 'live_image', maxCount: 1 },
    { name: 'reference_image', maxCount: 1 },
    { name: 'challenge_image', maxCount: 1 },
    { name: 'live_audio', maxCount: 1 },
    { name: 'reference_audio', maxCount: 1 }
  ]),
  VerificationController.submitBiometrics
);
router.get('/session/:sessionId', VerificationController.getStatus);

export default router;
