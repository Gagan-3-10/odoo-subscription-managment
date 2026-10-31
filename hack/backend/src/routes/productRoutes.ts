import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone logged in can view products
router.get('/', authenticate, ProductController.listProducts);
router.get('/:id', authenticate, ProductController.getProductById);

// Only ADMIN can create/update/archive products & variants
router.post('/', authenticate, requireRole(['ADMIN']), ProductController.createProduct);
router.put('/:id', authenticate, requireRole(['ADMIN']), ProductController.updateProduct);
router.delete('/:id', authenticate, requireRole(['ADMIN']), ProductController.deleteProduct);

router.post('/:id/variants', authenticate, requireRole(['ADMIN']), ProductController.addVariant);
router.put('/variants/:variantId', authenticate, requireRole(['ADMIN']), ProductController.updateVariant);
router.delete('/variants/:variantId', authenticate, requireRole(['ADMIN']), ProductController.deleteVariant);

export default router;
