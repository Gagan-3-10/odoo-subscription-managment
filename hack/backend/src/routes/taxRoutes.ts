import { Router } from 'express';
import { TaxController } from '../controllers/taxController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, TaxController.listTaxes);

// Admin-only module
router.use(authenticate, requireRole(['ADMIN']));
router.post('/', TaxController.createTax);
router.put('/:id', TaxController.updateTax);
router.patch('/:id/toggle-status', TaxController.toggleStatus);

export default router;
