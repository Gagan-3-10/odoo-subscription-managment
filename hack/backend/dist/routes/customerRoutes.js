"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// List all customers (Admin and Staff only)
router.get('/', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), customerController_1.CustomerController.listCustomers);
// Create customer (Admin and Staff only)
router.post('/', (0, auth_1.requireRole)(['ADMIN', 'STAFF']), customerController_1.CustomerController.createCustomer);
// Get customer by ID (Customer isolation handled in controller)
router.get('/:id', customerController_1.CustomerController.getCustomerById);
// Update customer
router.put('/:id', customerController_1.CustomerController.updateCustomer);
exports.default = router;
