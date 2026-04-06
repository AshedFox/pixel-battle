import { jwtDecode } from 'jwt-decode';

export type JwtPayload = {
  sub: string;
  role: string;
  status: string;
  exp?: number;
};

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}
