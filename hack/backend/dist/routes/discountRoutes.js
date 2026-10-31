"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discountController_1 = require("../controllers/discountController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, discountController_1.DiscountController.listDiscounts);
router.post('/validate', auth_1.authenticate, discountController_1.DiscountController.validateDiscount);
// Admin-only management
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), discountController_1.DiscountController.createDiscount);
router.patch('/:id/toggle-status', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), discountController_1.DiscountController.toggleStatus);
exports.default = router;
