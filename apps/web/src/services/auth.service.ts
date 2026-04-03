import { RequestResult } from '@/types/request';
import {
  LoginInput,
  LoginResponse,
  errorSchema,
  loginResponseSchema,
  RegisterInput,
  RegisterResponse,
  registerResponseSchema,
  RefreshResponse,
  refreshResponseSchema,
} from '@repo/shared';

export async function login(
  input: LoginInput,
): Promise<RequestResult<LoginResponse>> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: errorSchema.parse(data) };
    }

    return { data: loginResponseSchema.parse(data) };
  } catch {
    return { error: { message: 'Something went wrong' } };
  }
}

export async function register(
  input: RegisterInput,
): Promise<RequestResult<RegisterResponse>> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: errorSchema.parse(data) };
    }

    return { data: registerResponseSchema.parse(data) };
  } catch {
    return { error: { message: 'Something went wrong' } };
  }
}

export async function refresh(): Promise<RequestResult<RefreshResponse>> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: errorSchema.parse(data) };
    }

    return { data: refreshResponseSchema.parse(data) };
  } catch {
    return { error: { message: 'Something went wrong' } };
  }
}

export async function logout(): Promise<RequestResult<undefined>> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: errorSchema.parse(data) };
    }

    return { data: undefined };
  } catch {
    return { error: { message: 'Something went wrong' } };
  }
}

export async function confirmEmail(
  token: string,
): Promise<RequestResult<undefined>> {
  try {
    const res = await fetch(`/api/auth/confirm-email/${token}`, {
      method: 'POST',
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: errorSchema.parse(data) };
    }

    return { data: undefined };
  } catch {
    return { error: { message: 'Something went wrong' } };
  }
}
