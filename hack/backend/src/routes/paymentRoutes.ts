import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', PaymentController.listPayments);
router.post('/record', requireRole(['ADMIN', 'STAFF']), PaymentController.recordPayment);

// Razorpay test integration endpoints
router.post('/razorpay/create-order', PaymentController.createRazorpayOrder);
router.post('/razorpay/verify', PaymentController.verifyRazorpayPayment);

export default router;
