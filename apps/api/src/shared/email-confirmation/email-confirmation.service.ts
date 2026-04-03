import { Database } from '../../db';
import { users } from '../../db/schema/users';
import { and, eq } from 'drizzle-orm';
import { config } from '../../config';
import { randomBytes } from 'crypto';
import argon2 from 'argon2';
import { emailConfirmations } from '../../db/schema/email-confirmations';

export class EmailConfirmationService {
  constructor(private readonly db: Database['db']) {}

  async createConfirmationToken(userId: string) {
    const tokenSecret = randomBytes(32).toString('base64url');
    const tokenHash = await argon2.hash(tokenSecret);
    const expiresAt = new Date(Date.now() + config.EMAIL_CONFIRMATION_LIFETIME);

    const { id } = await this.db
      .insert(emailConfirmations)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning({ id: emailConfirmations.id })
      .then((r) => r[0]);

    return {
      token: `${id}.${tokenSecret}`,
      expiresAt,
    };
  }

  async confirmEmail(token: string): Promise<boolean> {
    const [id, secret] = token.split('.');

    if (!id || !secret) {
      return false;
    }

    const confirmation = await this.db
      .select({
        tokenHash: emailConfirmations.tokenHash,
        userId: emailConfirmations.userId,
        expiresAt: emailConfirmations.expiresAt,
      })
      .from(emailConfirmations)
      .where(eq(emailConfirmations.id, id))
      .then((r) => r[0] ?? null);

    if (!confirmation || confirmation.expiresAt < new Date()) {
      return false;
    }

    const isValid = await argon2
      .verify(confirmation.tokenHash, secret)
      .catch(() => false);

    if (!isValid) {
      return false;
    }

    const result = await this.db
      .update(users)
      .set({ status: 'CONFIRMED' })
      .where(
        and(eq(users.id, confirmation.userId), eq(users.status, 'UNCONFIRMED')),
      )
      .returning({ id: users.id })
      .then((r) => r[0] ?? null);

    await this.db
      .delete(emailConfirmations)
      .where(eq(emailConfirmations.id, id));

    return result !== null;
  }
}
