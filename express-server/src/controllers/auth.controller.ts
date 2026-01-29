import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    console.log('Register request body:', req.body);
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    console.log('Login request body:', req.body);
    try {
      const result = await authService.login(req.body, req);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.logout(req);
      sendSuccess(res, result, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
