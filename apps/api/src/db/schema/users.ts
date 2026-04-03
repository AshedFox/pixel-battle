import { pgEnum } from 'drizzle-orm/pg-core';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
  'UNCONFIRMED',
  'CONFIRMED',
]);

export type UserStatus = (typeof userStatusEnum.enumValues)[number];

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 127 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  status: userStatusEnum('status').notNull().default('UNCONFIRMED'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
