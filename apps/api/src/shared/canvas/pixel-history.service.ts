import { and, desc, eq } from 'drizzle-orm';
import { Database } from '../../db';
import { drawEvents, NewDrawEvent } from '../../db/schema/draw-events';
import { users } from '../../db/schema/users';

export class PixelHistoryService {
  constructor(private readonly db: Database['db']) {}

  async getLastPixelState(x: number, y: number) {
    return this.db
      .select({
        userId: drawEvents.userId,
        timestamp: drawEvents.timestamp,
        color: drawEvents.color,
        userName: users.name,
      })
      .from(drawEvents)
      .where(and(eq(drawEvents.x, x), eq(drawEvents.y, y)))
      .leftJoin(users, eq(users.id, drawEvents.userId))
      .orderBy(desc(drawEvents.timestamp))
      .limit(1)
      .then((r) => r[0] ?? null);
  }

  async getPixelHistory(x: number, y: number, limit: number = 20) {
    return this.db
      .select({
        userId: drawEvents.userId,
        timestamp: drawEvents.timestamp,
        color: drawEvents.color,
        userName: users.name,
      })
      .from(drawEvents)
      .where(and(eq(drawEvents.x, x), eq(drawEvents.y, y)))
      .leftJoin(users, eq(users.id, drawEvents.userId))
      .orderBy(desc(drawEvents.timestamp))
      .limit(limit);
  }

  async saveBatch(events: NewDrawEvent[]): Promise<void> {
    await this.db.insert(drawEvents).values(events);
  }
}
