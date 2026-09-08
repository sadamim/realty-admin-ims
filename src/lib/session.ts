// src/lib/session.ts
//
// Session token handling. Uses `jose` rather than `jsonwebtoken` because the
// same verify runs inside middleware.ts, which executes on the Edge runtime
// where Node crypto APIs are unavailable.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'rf_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or shorter than 32 characters. Generate one with:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: String(payload.sub),
      email: String(payload.email ?? ''),
      username: String(payload.username ?? ''),
      role: String(payload.role ?? 'user'),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
