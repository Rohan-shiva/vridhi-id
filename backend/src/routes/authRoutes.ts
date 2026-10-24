import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/request-otp', authRateLimiter, AuthController.requestOtp);
router.post('/verify-otp', authRateLimiter, AuthController.verifyOtp);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/language', authenticate, AuthController.updateLanguage);

export default router;
