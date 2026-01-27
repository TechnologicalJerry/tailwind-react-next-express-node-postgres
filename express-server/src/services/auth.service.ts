import { eq, or } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../db/schema';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_ROLE } from '../config/roles';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

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

  async login(data: LoginInput) {
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
    };
  }
}

export const authService = new AuthService();
