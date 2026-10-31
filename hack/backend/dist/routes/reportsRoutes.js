"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Finance reports accessible to Admin and Staff
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN', 'STAFF']), reportsController_1.ReportsController.getReport);
router.get('/export-csv', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN', 'STAFF']), reportsController_1.ReportsController.exportCSV);
exports.default = router;
