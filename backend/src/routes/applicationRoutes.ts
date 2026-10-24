import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', ApplicationController.create);
router.get('/', ApplicationController.getUserApplications);
router.get('/:id', ApplicationController.getById);

export default router;
