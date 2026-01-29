import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  
  // Database Configuration (individual variables)
  DB_USERNAME: z.string().min(1, 'DB_USERNAME is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_HOST: z.string().min(1, 'DB_HOST is required').default('localhost'),
  DB_PORT: z.string().regex(/^\d+$/).transform(Number).default('5432'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_MAX_AGE: z.string().regex(/^\d+$/).transform(Number).default('86400000'), // 24 hours in milliseconds
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  
  // Gmail SMTP Configuration
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).default('587'),
  SMTP_USER: z.string().email('SMTP_USER must be a valid email address'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Invalid environment variables:\n${missingVars.join('\n')}`
      );
    }
    throw error;
  }
}

const validatedEnv = validateEnv();

// Construct DATABASE_URL from individual components
function encodeURIComponentSafe(str: string): string {
  return encodeURIComponent(str).replace(/%20/g, '+');
}

export const env = {
  ...validatedEnv,
  DATABASE_URL: `postgresql://${validatedEnv.DB_USERNAME}:${encodeURIComponentSafe(validatedEnv.DB_PASSWORD)}@${validatedEnv.DB_HOST}:${validatedEnv.DB_PORT}/${validatedEnv.DB_NAME}`,
};
