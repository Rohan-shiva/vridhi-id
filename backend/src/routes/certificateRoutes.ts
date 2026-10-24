import { Router } from 'express';
import { CertificateController } from '../controllers/certificateController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/application/:applicationId', CertificateController.getByApplicationId);
router.get('/application/:applicationId/download', CertificateController.downloadPdf);

export default router;
