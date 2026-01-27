export const PERMISSIONS = {
  // User permissions
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_UPDATE: 'user:update',
  
  // Product permissions
  PRODUCT_READ: 'product:read',
  PRODUCT_WRITE: 'product:write',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_UPDATE: 'product:update',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_WRITE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_UPDATE,
  ],
  manager: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_WRITE,
    PERMISSIONS.PRODUCT_UPDATE,
  ],
  user: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.PRODUCT_READ,
  ],
};
