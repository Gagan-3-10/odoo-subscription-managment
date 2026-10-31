import { Router } from 'express';
import { PlanController } from '../controllers/planController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone logged in can view plans
router.get('/', authenticate, PlanController.listPlans);
router.get('/:id', authenticate, PlanController.getPlanById);

// Only ADMIN can create/edit/toggle plans
router.post('/', authenticate, requireRole(['ADMIN']), PlanController.createPlan);
router.put('/:id', authenticate, requireRole(['ADMIN']), PlanController.updatePlan);
router.patch('/:id/toggle-status', authenticate, requireRole(['ADMIN']), PlanController.toggleStatus);

export default router;
