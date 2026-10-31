"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staffController_1 = require("../controllers/staffController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Only ADMIN can access staff management
router.use(auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']));
router.get('/', staffController_1.StaffController.listStaff);
router.post('/', staffController_1.StaffController.createStaff);
router.put('/:id', staffController_1.StaffController.updateStaff);
router.delete('/:id', staffController_1.StaffController.deleteStaff);
exports.default = router;
