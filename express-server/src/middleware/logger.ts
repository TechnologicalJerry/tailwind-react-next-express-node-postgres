import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env';

// Create Pino logger instance
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined, // In production, use default JSON output
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Generate request ID
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Custom serializers for request/response logging
const serializers = {
  req: (req: Request) => {
    const sanitized: any = {
      id: req.id || generateRequestId(),
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      remoteAddress: req.ip || req.socket?.remoteAddress || 'unknown',
      remotePort: req.socket?.remotePort || undefined,
    };

    // Include body for non-GET requests (sanitize sensitive fields)
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0 && req.method !== 'GET') {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';
      sanitized.body = sanitizedBody;
    }

    return sanitized;
  },
  res: (res: Response) => {
    return {
      statusCode: res.statusCode,
      headers: typeof res.getHeaders === 'function' ? res.getHeaders() : {},
    };
  },
};

// HTTP request logger middleware using pino-http
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: Request) => {
    return (req.id as string) || generateRequestId();
  },
  serializers,
  customLogLevel: (req: Request, res: Response, err?: Error) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage: (req: Request, res: Response, err?: Error) => {
    return `${req.method} ${req.url} errored`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'responseTime',
  },
  // Skip logging for health checks in production
  autoLogging: {
    ignore: (req: Request) => {
      return env.NODE_ENV === 'production' && req.url === '/health';
    },
  },
});

// Request logger middleware (logs incoming requests with more details)
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = (req.id as string) || generateRequestId();
  req.id = requestId;

  // Log incoming request
  logger.info(
    {
      request: {
        id: requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        ip: req.ip || req.socket?.remoteAddress || 'unknown',
      },
    },
    `Incoming ${req.method} ${req.url}`
  );

  // Log body if it exists and is not a GET request
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0 && req.method !== 'GET') {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';
    
    logger.debug(
      {
        request: {
          id: requestId,
          body: sanitizedBody,
        },
      },
      'Request body'
    );
  }

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](
      {
        request: {
          id: requestId,
          method: req.method,
          url: req.url,
        },
        response: {
          statusCode: res.statusCode,
          duration,
        },
      },
      `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

// Export the logger instance for use in other parts of the application
export { logger };
export default logger;
