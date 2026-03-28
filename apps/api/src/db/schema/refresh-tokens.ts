import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { AnyPgColumn } from 'drizzle-orm/pg-core';
import { isNotNull } from 'drizzle-orm';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),
    ip: varchar('ip', { length: 45 }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    replacedByTokenId: uuid('replaced_by_token_id').references(
      (): AnyPgColumn => refreshTokens.id,
      { onDelete: 'set null' },
    ),
  },
  (table) => [
    index('idx_refresh_tokens_user_id').on(table.userId),
    index('idx_refresh_tokens_replaced_by_token_id')
      .on(table.replacedByTokenId)
      .where(isNotNull(table.replacedByTokenId)),
    index('idx_refresh_tokens_expires_at').on(table.expiresAt),
  ],
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
