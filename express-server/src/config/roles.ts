import { Role } from '../types/roles';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  manager: 2,
  user: 1,
};

export const DEFAULT_ROLE: Role = 'user';

export function hasRoleAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
