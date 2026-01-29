import { eq, or } from 'drizzle-orm';
import { Request } from 'express';
import { db } from '../config/database';
import { users } from '../db/schema';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_ROLE } from '../config/roles';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../validators/auth.validator';
import { sessionService } from './session.service';
import { generateResetToken, hashResetToken, verifyResetToken } from '../utils/resetToken';
import { emailService } from './email.service';

export class AuthService {
  async register(data: RegisterInput) {
    // Check if email already exists
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // Check if username already exists
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.userName, data.userName))
      .limit(1);

    if (existingUsername.length > 0) {
      throw new AppError('Username is already taken', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    // Parse date of birth if provided (Drizzle date type expects string in 'YYYY-MM-DD' format)
    const dobValue = data.dob && data.dob.trim() !== '' ? data.dob : null;

    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        userName: data.userName,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: dobValue,
        gender: data.gender,
        role: DEFAULT_ROLE,
      })
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
      });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: newUser,
      token,
    };
  }

  async login(data: LoginInput, req: Request) {
    // Try to find user by email or username
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, data.emailOrUsername),
          eq(users.userName, data.emailOrUsername)
        )!
      )
      .limit(1);

    if (!user) {
      throw new AppError('Invalid email/username or password', 401);
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email/username or password', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session if session exists in request
    if (req.session) {
      const sessionId = req.sessionID;
      await sessionService.createSession(sessionId, user.id, req);
      
      // Store user info in session
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.role = user.role;
      req.session.status = 'login';
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        dob: user.dob,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
      sessionId: req.session?.id,
      status: 'login',
    };
  }

  async logout(req: Request): Promise<{ status: string }> {
    if (!req.session) {
      throw new AppError('No active session found', 400);
    }

    const sessionId = req.sessionID;
    
    // Update session status in database
    await sessionService.updateSessionStatus(sessionId, 'logged_out');
    
    // Update session status
    if (req.session) {
      req.session.status = 'logout';
    }

    // Destroy session
    return new Promise((resolve, reject) => {
      req.session?.destroy((err) => {
        if (err) {
          reject(new AppError('Failed to logout', 500));
        } else {
          resolve({ status: 'logout' });
        }
      });
    });
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    // Don't reveal if email exists or not (security best practice)
    // Always return success message even if user doesn't exist
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);
    
    // Set expiration to 1 hour from now
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token and expiration to database
    await db
      .update(users)
      .set({
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.userName || user.firstName || undefined
      );
    } catch (error) {
      // If email fails, clear the reset token
      await db
        .update(users)
        .set({
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(users.id, user.id));
      
      throw new AppError('Failed to send password reset email. Please try again later.', 500);
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    // Hash the token to compare with stored hash
    const hashedToken = hashResetToken(data.token);

    // Find user with valid reset token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, hashedToken))
      .limit(1);

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token has expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      // Clear expired token
      await db
        .update(users)
        .set({
          passwordResetToken: null,
          passwordResetExpires: null,
        })
        .where(eq(users.id, user.id));
      
      throw new AppError('Reset token has expired. Please request a new password reset.', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.password);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return {
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}

export const authService = new AuthService();
