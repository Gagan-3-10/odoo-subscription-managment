import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', SubscriptionController.listSubscriptions);
router.get('/:id', SubscriptionController.getSubscriptionById);
router.post('/', requireRole(['ADMIN', 'STAFF']), SubscriptionController.createSubscription);
// Status changes (Customer can pause/resume/cancel their own if allowed by plan, Admin/Staff can do any)
router.post('/:id/change-status', SubscriptionController.changeStatus);

export default router;
