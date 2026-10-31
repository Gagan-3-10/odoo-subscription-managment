"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = require("../controllers/invoiceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', invoiceController_1.InvoiceController.listInvoices);
router.get('/:id', invoiceController_1.InvoiceController.getInvoiceById);
router.get('/:id/pdf', invoiceController_1.InvoiceController.downloadInvoicePDF);
router.patch('/:id/status', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), invoiceController_1.InvoiceController.updateStatus);
// Automated billing engine triggers
router.post('/run-automated-billing', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), invoiceController_1.InvoiceController.runAutomatedBilling);
router.post('/check-overdue', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), invoiceController_1.InvoiceController.checkOverdueInvoices);
exports.default = router;
