import { Router } from 'express';
import authRoutes from './authRoutes';
import applicationRoutes from './applicationRoutes';
import verificationRoutes from './verificationRoutes';
import certificateRoutes from './certificateRoutes';
import officerRoutes from './officerRoutes';
import systemRoutes from './systemRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/verification', verificationRoutes);
router.use('/certificates', certificateRoutes);
router.use('/officer', officerRoutes);
router.use('/system', systemRoutes);

export default router;
