import { Router } from 'express';
import { OfficerController } from '../controllers/officerController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['officer', 'admin']));

router.get('/queue', OfficerController.getQueue);
router.get('/case/:id', OfficerController.getCaseDetails);
router.post('/case/:id/review', OfficerController.recordReview);
router.get('/audit-logs', OfficerController.getAuditLogs);

export default router;
