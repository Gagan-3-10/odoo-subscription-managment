"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', paymentController_1.PaymentController.listPayments);
router.post('/record', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), paymentController_1.PaymentController.recordPayment);
// Razorpay test integration endpoints
router.post('/razorpay/create-order', paymentController_1.PaymentController.createRazorpayOrder);
router.post('/razorpay/verify', paymentController_1.PaymentController.verifyRazorpayPayment);
exports.default = router;
