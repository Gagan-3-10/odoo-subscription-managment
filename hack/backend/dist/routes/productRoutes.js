"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Everyone logged in can view products
router.get('/', auth_1.authenticate, productController_1.ProductController.listProducts);
router.get('/:id', auth_1.authenticate, productController_1.ProductController.getProductById);
// Only ADMIN can create/update/archive products & variants
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), productController_1.ProductController.createProduct);
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), productController_1.ProductController.updateProduct);
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), productController_1.ProductController.deleteProduct);
router.post('/:id/variants', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), productController_1.ProductController.addVariant);
router.put('/variants/:variantId', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), productController_1.ProductController.updateVariant);
router.delete('/variants/:variantId', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), productController_1.ProductController.deleteVariant);
exports.default = router;
