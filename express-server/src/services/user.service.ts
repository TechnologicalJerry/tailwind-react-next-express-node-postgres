import { eq, and, or, like, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import { UpdateUserInput, GetUsersQuery } from '../validators/user.validator';
import { Role } from '../types/roles';

export class UserService {
  async getUsers(query: GetUsersQuery) {
    const { page, limit, search, role } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.userName, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )!
      );
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allUsers, totalCount] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          userName: users.userName,
          firstName: users.firstName,
          lastName: users.lastName,
          dob: users.dob,
          gender: users.gender,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: users.id })
        .from(users)
        .where(whereClause)
        .then((result) => result.length),
    ]);

    return {
      users: allUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getUserById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        userName: users.userName,
        firstName: users.firstName,
        lastName: users.lastName,
        dob: users.dob,
        gender: users.gender,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserInput, currentUserId: string, currentUserRole: Role) {
    // Users can only update themselves unless they're admin/manager
    if (id !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'manager') {
      throw new AppError('You can only update your own profile', 403);
    }

    const existingUser = await this.getUserById(id);

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (emailUser) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Check if userName is being changed and if it's already taken
    if (data.userName && data.userName !== existingUser.userName) {
      const [usernameUser] = await db
        .select()
        .from(users)
        .where(eq(users.userName, data.userName))
        .limit(1);

      if (usernameUser) {
        throw new AppError('Username is already taken', 409);
      }
    }

    // Prepare update data
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle dob conversion if provided (Drizzle date type expects string in 'YYYY-MM-DD' format)
    if (data.dob !== undefined) {
      updateData.dob = data.dob && data.dob.trim() !== '' ? data.dob : null;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        userName: users.userName,
        firstName: users.firstName,
        lastName: users.lastName,
        dob: users.dob,
        gender: users.gender,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  async deleteUser(id: string, currentUserId: string, currentUserRole: Role) {
    // Prevent users from deleting themselves
    if (id === currentUserId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // Only admin can delete users
    if (currentUserRole !== 'admin') {
      throw new AppError('Only admins can delete users', 403);
    }

    const user = await this.getUserById(id);

    await db.delete(users).where(eq(users.id, id));

    return { message: 'User deleted successfully' };
  }

  async updateUserRole(id: string, role: Role, currentUserRole: Role) {
    // Only admin can change roles
    if (currentUserRole !== 'admin') {
      throw new AppError('Only admins can change user roles', 403);
    }

    await this.getUserById(id); // Check if user exists

    const [updatedUser] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        userName: users.userName,
        firstName: users.firstName,
        lastName: users.lastName,
        dob: users.dob,
        gender: users.gender,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }
}

export const userService = new UserService();
