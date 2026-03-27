export const ACCESS_TOKEN_ERRORS = [
  'ACCESS_TOKEN_EXPIRED',
  'UNAUTHORIZED',
] as const;

export type AccessTokenErrros = (typeof ACCESS_TOKEN_ERRORS)[number];
