import { AccessErrorResponse, ErrorResponse } from '@repo/shared';

export type RequestResult<T, WithAuth extends boolean = true> =
  | {
      error: WithAuth extends true
        ? AccessErrorResponse | ErrorResponse
        : ErrorResponse;
      data?: never;
    }
  | { error?: never; data: T };
