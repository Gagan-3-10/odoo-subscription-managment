"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', subscriptionController_1.SubscriptionController.listSubscriptions);
router.get('/:id', subscriptionController_1.SubscriptionController.getSubscriptionById);
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), subscriptionController_1.SubscriptionController.createSubscription);
// Status changes (Customer can pause/resume/cancel their own if allowed by plan, Admin/Staff can do any)
router.post('/:id/change-status', subscriptionController_1.SubscriptionController.changeStatus);
exports.default = router;
