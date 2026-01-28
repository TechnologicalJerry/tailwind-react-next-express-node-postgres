import { Role } from './roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }

    namespace Express {
      namespace Session {
        interface SessionData {
          userId?: string;
          email?: string;
          role?: Role;
          status?: 'login' | 'logout';
        }
      }
    }
  }
}
