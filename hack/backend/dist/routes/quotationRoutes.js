"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotationController_1 = require("../controllers/quotationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Templates (Admin and Staff)
router.get('/templates', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), quotationController_1.QuotationController.listTemplates);
router.post('/templates', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), quotationController_1.QuotationController.createTemplate);
router.delete('/templates/:id', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), quotationController_1.QuotationController.deleteTemplate);
// Quotations
router.get('/', quotationController_1.QuotationController.listQuotations);
router.get('/:id', quotationController_1.QuotationController.getQuotationById);
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), quotationController_1.QuotationController.createQuotation);
router.patch('/:id/status', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), quotationController_1.QuotationController.updateStatus);
router.post('/:id/convert-subscription', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), quotationController_1.QuotationController.convertToSubscription);
exports.default = router;
