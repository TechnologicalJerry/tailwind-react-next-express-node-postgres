import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/checkPermission';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  getProductsSchema,
  deleteProductSchema,
} from '../validators/product.validator';

const router = Router();

// Get all products (public, but authenticated users get more info)
router.get(
  '/',
  validate(getProductsSchema),
  productController.getProducts.bind(productController)
);

// Get product by ID (public)
router.get(
  '/:id',
  validate(getProductSchema),
  productController.getProductById.bind(productController)
);

// Create product (requires authentication and permission)
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_WRITE),
  validate(createProductSchema),
  productController.createProduct.bind(productController)
);

// Update product (requires authentication and permission)
router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  validate(updateProductSchema),
  productController.updateProduct.bind(productController)
);

// Delete product (requires authentication and permission)
router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_DELETE),
  validate(deleteProductSchema),
  productController.deleteProduct.bind(productController)
);

export default router;
