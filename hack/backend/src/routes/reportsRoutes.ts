import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Finance reports accessible to Admin and Staff
router.get('/', authenticate, requireRole(['ADMIN', 'STAFF']), ReportsController.getReport);
router.get('/export-csv', authenticate, requireRole(['ADMIN', 'STAFF']), ReportsController.exportCSV);

export default router;
