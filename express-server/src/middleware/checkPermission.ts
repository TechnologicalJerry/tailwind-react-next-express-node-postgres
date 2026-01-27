import { Request, Response, NextFunction } from 'express';
import { Permission } from '../constants/permissions';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';
import { sendError } from '../utils/responses';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}

export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}
