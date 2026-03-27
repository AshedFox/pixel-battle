import argon2 from 'argon2';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { Database } from '../../db';
import { User, users } from '../../db/schema/users';
import { JWT } from '@fastify/jwt';
import { config } from '../../config';
import { randomBytes } from 'crypto';
import { refreshTokens } from '../../db/schema/refresh-tokens';

const argonOptions: argon2.Options = {
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
};

const argonRefreshOptions: argon2.Options = {
  ...argonOptions,
  secret: Buffer.from(config.REFRESH_TOKEN_SECRET),
};

export class AuthService {
  constructor(
    private readonly db: Database['db'],
    private readonly jwt: JWT,
  ) {}

  async makeTokens(userId: string, ip: string) {
    const accessToken = this.jwt.sign(
      { sub: userId },
      { algorithm: 'HS512', expiresIn: config.JWT_LIFETIME },
    );

    const refreshTokenSecret = randomBytes(32).toString('base64url');
    const tokenHash = await argon2.hash(
      refreshTokenSecret,
      argonRefreshOptions,
    );

    const { id: refreshTokenId } = await this.db.transaction(async (tx) => {
      const maxTokensPerUser = 20;
      const tokens = await tx
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, userId))
        .orderBy(desc(refreshTokens.createdAt));

      if (tokens.length >= maxTokensPerUser) {
        await tx.delete(refreshTokens).where(
          inArray(
            refreshTokens.id,
            tokens.slice(maxTokensPerUser - 1).map((t) => t.id),
          ),
        );
      }

      return tx
        .insert(refreshTokens)
        .values({
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_LIFETIME),
          ip,
        })
        .returning({ id: refreshTokens.id })
        .then((r) => r[0]);
    });

    const refreshToken = `${refreshTokenId}.${refreshTokenSecret}`;

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + config.JWT_LIFETIME),
    };
  }

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const FAKE_HASH =
      '$argon2id$v=19$m=65536,t=3,p=1$0pbburAKJvWjClXbjTd8iw$aA2BS0GumT6kHBs5ZUai43pecvG8GDE4KolhSbWEfOc';

    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((r) => r[0]);

    const hash = user?.passwordHash ?? FAKE_HASH;
    const passwordValid = await argon2
      .verify(hash, password, argonOptions)
      .catch(() => false);

    return user && passwordValid ? user : null;
  }

  async registerUser(email: string, password: string, name: string) {
    return this.db
      .insert(users)
      .values({
        email,
        passwordHash: await argon2.hash(password, argonOptions),
        name,
      })
      .onConflictDoNothing()
      .returning({ id: users.id })
      .then((r) => r[0] ?? null);
  }

  async verifyRefresh(token: string) {
    const [tokenId, secret] = token.split('.');

    if (!tokenId || !secret) {
      return null;
    }

    return this.db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.id, tokenId))
        .for('update')
        .then((r) => r[0] ?? null);

      if (!existing) {
        return null;
      }

      const isValid = await argon2
        .verify(existing.tokenHash, secret, argonRefreshOptions)
        .catch(() => false);

      if (!isValid) {
        return null;
      }

      if (existing.revokedAt !== null || existing.expiresAt < new Date()) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshTokens.userId, existing.userId),
              isNull(refreshTokens.revokedAt),
            ),
          );

        return null;
      }

      return tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, existing.id))
        .returning({ id: refreshTokens.id, userId: refreshTokens.userId })
        .then((r) => r[0] ?? null);
    });
  }

  async invalidateRefresh(token: string): Promise<boolean> {
    const [tokenId, secret] = token.split('.');

    if (!tokenId || !secret) {
      return false;
    }

    const existing = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, tokenId))
      .then((r) => r[0] ?? null);

    if (!existing) {
      return false;
    }

    const isValid = await argon2
      .verify(existing.tokenHash, secret, argonRefreshOptions)
      .catch(() => false);

    if (!isValid) {
      return false;
    }

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenId));

    return true;
  }

  async rotateTokens(refreshToken: string, ip: string) {
    const verified = await this.verifyRefresh(refreshToken);

    if (!verified) {
      return null;
    }

    return this.makeTokens(verified.userId, ip);
  }
}
