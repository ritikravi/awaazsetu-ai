import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, dashboardController.getStats.bind(dashboardController));
router.get('/analytics', authenticate, dashboardController.getAnalytics.bind(dashboardController));

export default router;
