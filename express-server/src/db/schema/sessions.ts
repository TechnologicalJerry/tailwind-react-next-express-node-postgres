import { pgTable, uuid, varchar, timestamp, pgEnum, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const sessionStatusEnum = pgEnum('session_status', ['active', 'logged_out', 'expired']);

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sid: varchar('sid', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull(),
  status: sessionStatusEnum('status').default('active').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  loggedOutAt: timestamp('logged_out_at'),
});

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
