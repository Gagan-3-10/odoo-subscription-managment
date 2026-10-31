"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taxController_1 = require("../controllers/taxController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, taxController_1.TaxController.listTaxes);
// Admin-only module
router.use(auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']));
router.post('/', taxController_1.TaxController.createTax);
router.put('/:id', taxController_1.TaxController.updateTax);
router.patch('/:id/toggle-status', taxController_1.TaxController.toggleStatus);
exports.default = router;
