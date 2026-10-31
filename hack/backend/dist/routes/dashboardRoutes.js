"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Dashboard is accessible to Admin and Staff
router.get('/metrics', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN', 'STAFF']), dashboardController_1.DashboardController.getDashboardMetrics);
exports.default = router;
