import z from 'zod';
import {
  accessTokenErrorSchema,
  confirmEmailParamsSchema,
  loginBodySchema,
  loginResponseSchema,
  refreshResponseSchema,
  registerBodySchema,
} from './schemas';

export type LoginInput = z.infer<typeof loginBodySchema>;
export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
export type AccessErrorResponse = z.infer<typeof accessTokenErrorSchema>;
export type ConfirmEmailParams = z.infer<typeof confirmEmailParamsSchema>;
