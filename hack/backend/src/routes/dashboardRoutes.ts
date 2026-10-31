import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Dashboard is accessible to Admin and Staff
router.get('/metrics', authenticate, requireRole(['ADMIN', 'STAFF']), DashboardController.getDashboardMetrics);

export default router;
