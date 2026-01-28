export type Role = 'admin' | 'manager' | 'user';

export interface UserRole {
  id: string;
  userId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
