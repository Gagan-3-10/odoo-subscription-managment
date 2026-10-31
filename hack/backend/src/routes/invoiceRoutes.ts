import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', InvoiceController.listInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.get('/:id/pdf', InvoiceController.downloadInvoicePDF);
router.patch('/:id/status', requireRole(['ADMIN', 'STAFF']), InvoiceController.updateStatus);

// Automated billing engine triggers
router.post('/run-automated-billing', requireRole(['ADMIN', 'STAFF']), InvoiceController.runAutomatedBilling);
router.post('/check-overdue', requireRole(['ADMIN', 'STAFF']), InvoiceController.checkOverdueInvoices);

export default router;
