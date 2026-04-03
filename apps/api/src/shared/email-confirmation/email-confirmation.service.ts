import { JWT } from '@fastify/jwt';
import { Database } from '../../db';
import { users } from '../../db/schema/users';
import { and, eq } from 'drizzle-orm';
import { config } from '../../config';
import { EmailConfirmationJwtPayload } from './types';

export class EmailConfirmationService {
  constructor(
    private readonly jwt: JWT,
    private readonly db: Database['db'],
  ) {}

  createConfirmationToken(payload: EmailConfirmationJwtPayload): string {
    return this.jwt.sign(payload, {
      algorithm: 'HS512',
      expiresIn: '72h',
      key: config.EMAIL_CONFIRMATION_SECRET,
    });
  }

  async confirmEmail(token: string): Promise<boolean> {
    try {
      const payload = this.jwt.verify<EmailConfirmationJwtPayload>(token, {
        key: config.EMAIL_CONFIRMATION_SECRET,
      });

      const result = await this.db
        .update(users)
        .set({ status: 'CONFIRMED' })
        .where(and(eq(users.id, payload.sub), eq(users.status, 'UNCONFIRMED')))
        .returning({ id: users.id })
        .then((r) => r[0] ?? null);

      return result !== null;
    } catch {
      return false;
    }
  }
}
