"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const planController_1 = require("../controllers/planController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Everyone logged in can view plans
router.get('/', auth_1.authenticate, planController_1.PlanController.listPlans);
router.get('/:id', auth_1.authenticate, planController_1.PlanController.getPlanById);
// Only ADMIN can create/edit/toggle plans
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), planController_1.PlanController.createPlan);
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), planController_1.PlanController.updatePlan);
router.patch('/:id/toggle-status', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), planController_1.PlanController.toggleStatus);
exports.default = router;
