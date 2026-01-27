import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/roles';
import { hasRoleAccess } from '../config/roles';
import { sendError } from '../utils/responses';
import { AppError } from './errorHandler';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userRole = req.user.role;

    const hasAccess = allowedRoles.some((role) =>
      hasRoleAccess(userRole, role)
    );

    if (!hasAccess) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}

export function requireMinimumRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!hasRoleAccess(req.user.role, minimumRole)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
}
