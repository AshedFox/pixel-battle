import { UserRole, UserStatus } from '../../db/schema/users';

export type UserJwtPayload = {
  sub: string;
  status: UserStatus;
  role: UserRole;
};
