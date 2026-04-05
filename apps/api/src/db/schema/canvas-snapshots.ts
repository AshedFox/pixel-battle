import {
  customType,
  index,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';

const customBuffer = customType<{
  data: Buffer;
  driverData: Buffer;
  default: false;
}>({
  dataType() {
    return 'bytea';
  },
});

export const canvasSnapshots = pgTable(
  'canvas_snapshots',
  {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    data: customBuffer('data').notNull(),
  },
  (table) => [index('idx_snapshot_timestamp').on(table.timestamp)],
);

export type CanvasSnapshot = typeof canvasSnapshots.$inferSelect;
export type NewCanvasSnapshot = typeof canvasSnapshots.$inferInsert;
