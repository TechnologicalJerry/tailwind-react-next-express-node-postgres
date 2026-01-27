import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/responses';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(
      res,
      'Validation failed',
      400,
      JSON.stringify(errors)
    );
  }

  // Custom application errors
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  return sendError(
    res,
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
}
