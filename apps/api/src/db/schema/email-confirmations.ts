import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const emailConfirmations = pgTable(
  'email_confirmations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_email_confirmations_user_id').on(table.userId),
    index('idx_email_confirmations_expires_at').on(table.expiresAt),
  ],
);

export type EmailConfirmation = typeof emailConfirmations.$inferSelect;
export type NewEmailConfirmation = typeof emailConfirmations.$inferInsert;
