import { Router } from 'express';
import { QuotationController } from '../controllers/quotationController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Templates (Admin and Staff)
router.get('/templates', requireRole(['ADMIN', 'STAFF']), QuotationController.listTemplates);
router.post('/templates', requireRole(['ADMIN', 'STAFF']), QuotationController.createTemplate);
router.delete('/templates/:id', requireRole(['ADMIN', 'STAFF']), QuotationController.deleteTemplate);

// Quotations
router.get('/', QuotationController.listQuotations);
router.get('/:id', QuotationController.getQuotationById);
router.post('/', requireRole(['ADMIN', 'STAFF']), QuotationController.createQuotation);
router.patch('/:id/status', requireRole(['ADMIN', 'STAFF']), QuotationController.updateStatus);
router.post('/:id/convert-subscription', requireRole(['ADMIN', 'STAFF']), QuotationController.convertToSubscription);

export default router;
