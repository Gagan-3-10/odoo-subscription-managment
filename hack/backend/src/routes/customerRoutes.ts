import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// List all customers (Admin and Staff only)
router.get('/', requireRole(['ADMIN', 'STAFF']), CustomerController.listCustomers);
// Create customer (Admin and Staff only)
router.post('/', requireRole(['ADMIN', 'STAFF']), CustomerController.createCustomer);
// Get customer by ID (Customer isolation handled in controller)
router.get('/:id', CustomerController.getCustomerById);
// Update customer
router.put('/:id', CustomerController.updateCustomer);

export default router;
