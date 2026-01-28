import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { env } from './env';

const PgSession = connectPgSimple(session);

export const sessionConfig: session.SessionOptions = {
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PgSession({
    conString: env.DATABASE_URL,
    tableName: 'user_sessions', // Table name for connect-pg-simple
    createTableIfMissing: true,
  }),
  cookie: {
    secure: env.NODE_ENV === 'production', // Only send cookies over HTTPS in production
    httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
    maxAge: env.SESSION_MAX_AGE, // 24 hours by default
    sameSite: 'lax', // CSRF protection
  },
  name: 'sessionId', // Custom session name
};
