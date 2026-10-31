import { Router } from 'express';
import { DiscountController } from '../controllers/discountController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, DiscountController.listDiscounts);
router.post('/validate', authenticate, DiscountController.validateDiscount);

// Admin-only management
router.post('/', authenticate, requireRole(['ADMIN']), DiscountController.createDiscount);
router.patch('/:id/toggle-status', authenticate, requireRole(['ADMIN']), DiscountController.toggleStatus);

export default router;
