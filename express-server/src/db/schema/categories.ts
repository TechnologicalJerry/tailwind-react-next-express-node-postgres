import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).extend({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const selectCategorySchema = createSelectSchema(categories);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
