import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { sessions } from '../db/schema';
import { Request } from 'express';

export class SessionService {
  async createSession(
    sessionId: string,
    userId: string,
    req: Request
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await db.insert(sessions).values({
      sid: sessionId,
      userId,
      status: 'active',
      ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || null,
      expiresAt,
    });
  }

  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'logged_out' | 'expired'
  ): Promise<void> {
    await db
      .update(sessions)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'logged_out' && { loggedOutAt: new Date() }),
      })
      .where(eq(sessions.sid, sessionId));
  }

  async getSessionBySid(sessionId: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sid, sessionId))
      .limit(1);

    return session;
  }

  async getUserActiveSessions(userId: string) {
    return await db
      .select()
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), eq(sessions.status, 'active'))
      );
  }

  async logoutAllUserSessions(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({
        status: 'logged_out',
        updatedAt: new Date(),
        loggedOutAt: new Date(),
      })
      .where(
        and(eq(sessions.userId, userId), eq(sessions.status, 'active'))
      );
  }
}

export const sessionService = new SessionService();
