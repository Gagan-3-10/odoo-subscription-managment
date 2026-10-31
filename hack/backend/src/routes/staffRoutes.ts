import { Router } from 'express';
import { StaffController } from '../controllers/staffController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Only ADMIN can access staff management
router.use(authenticate, requireRole(['ADMIN']));

router.get('/', StaffController.listStaff);
router.post('/', StaffController.createStaff);
router.put('/:id', StaffController.updateStaff);
router.delete('/:id', StaffController.deleteStaff);

export default router;
