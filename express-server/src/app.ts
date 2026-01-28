import express, { Application } from 'express';
import cors from 'cors';
import session from 'express-session';
import { env } from './config/env';
import { sessionConfig } from './config/session';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { httpLogger, requestLogger } from './middleware/logger';

const app: Application = express();

// Pino HTTP logger (for HTTP request logging)
app.use(httpLogger);

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Session middleware (must be before routes)
app.use(session(sessionConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (after body parser to log request body)
app.use(requestLogger);

// Rate limiting
app.use(apiRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
