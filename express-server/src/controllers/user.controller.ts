import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendPaginated } from '../utils/responses';

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getUsers(req.query as any);
      sendPaginated(
        res,
        result.users,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Users retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = await userService.updateUser(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const result = await userService.deleteUser(
        req.params.id,
        req.user.id,
        req.user.role
      );
      sendSuccess(res, result, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = await userService.updateUserRole(
        req.params.id,
        req.body.role,
        req.user.role
      );
      sendSuccess(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
