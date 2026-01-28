import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responses';
import { env } from '../config/env';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = store[key];

    // Clean up expired entries
    if (record && record.resetTime < now) {
      delete store[key];
    }

    const currentRecord = store[key];

    if (!currentRecord) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    if (currentRecord.count >= max) {
      const retryAfter = Math.ceil((currentRecord.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      sendError(res, message, 429);
      return;
    }

    currentRecord.count++;

    // Track response status if needed
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode < 400) {
          currentRecord.count--;
        }
        return originalSend.call(this, body);
      };
    }

    next();
  };
}

// Pre-configured rate limiters
// More lenient limits in development for testing
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 5 : 50, // 5 requests in production, 50 in development
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests in production, 1000 in development
});
