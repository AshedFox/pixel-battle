import {
  bigserial,
  index,
  pgTable,
  smallint,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const drawEvents = pgTable(
  'draw_events',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    x: smallint('x').notNull(),
    y: smallint('y').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    color: smallint('color').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index('idx_user_id_timestamp').on(table.userId, table.timestamp),
    index('idx_x_y').on(table.x, table.y),
  ],
);

export type DrawEvent = typeof drawEvents.$inferSelect;
export type NewDrawEvent = typeof drawEvents.$inferInsert;
