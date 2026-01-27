import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireRole, requireMinimumRole } from '../middleware/rbac';
import { requirePermission, requireAnyPermission } from '../middleware/checkPermission';
import { PERMISSIONS } from '../constants/permissions';
import { validate } from '../middleware/validate';
import {
  getUsersSchema,
  getUserSchema,
  updateUserSchema,
  deleteUserSchema,
  updateUserRoleSchema,
} from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (admin, manager)
router.get(
  '/',
  requireAnyPermission(PERMISSIONS.USER_READ),
  validate(getUsersSchema),
  userController.getUsers.bind(userController)
);

// Get user by ID
router.get(
  '/:id',
  requireAnyPermission(PERMISSIONS.USER_READ),
  validate(getUserSchema),
  userController.getUserById.bind(userController)
);

// Update user
router.put(
  '/:id',
  requireAnyPermission(PERMISSIONS.USER_UPDATE),
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

// Delete user (admin only)
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.USER_DELETE),
  validate(deleteUserSchema),
  userController.deleteUser.bind(userController)
);

// Update user role (admin only)
router.patch(
  '/:id/role',
  requireRole('admin'),
  validate(updateUserRoleSchema),
  userController.updateUserRole.bind(userController)
);

export default router;
