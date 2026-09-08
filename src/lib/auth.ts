// src/lib/auth.ts
// SERVER ONLY (Node runtime — bcryptjs cannot run on the Edge runtime).
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/mongodb';
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from '@/lib/session';

const BCRYPT_ROUNDS = 12;

/** A bcrypt hash always starts with $2a$ / $2b$ / $2y$. */
const isHashed = (value: string) => /^\$2[aby]\$/.test(value ?? '');

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const escapeRegex = (value: string) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface AuthResult {
  ok: boolean;
  user?: SessionUser;
  reason?: string;
}

/**
 * Verify an email/password pair against the `admin` collection.
 *
 * The imported rows store passwords in PLAIN TEXT (the old Express API did
 * `Admin.findOne({ email, password })`). We accept a legacy plaintext match
 * once, then immediately replace it with a bcrypt hash — so existing accounts
 * keep working and silently upgrade on first login. New accounts are always
 * hashed.
 */
export async function verifyCredentials(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) return { ok: false, reason: 'Email and password are required.' };

  const db = await getDb();
  const admin = await db
    .collection('admin')
    .findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') });

  if (!admin) return { ok: false, reason: 'Invalid email or password.' };

  const stored = String(admin.password ?? '');
  let matched = false;

  if (isHashed(stored)) {
    matched = await bcrypt.compare(password, stored);
  } else if (stored.length > 0 && stored === password) {
    matched = true;
    // Legacy plaintext row — upgrade it now so it is never stored in the clear again.
    try {
      await db
        .collection('admin')
        .updateOne({ _id: admin._id }, { $set: { password: await hashPassword(password) } });
    } catch {
      // Upgrading is best-effort; a failure must not block a valid login.
    }
  }

  if (!matched) return { ok: false, reason: 'Invalid email or password.' };
  if (String(admin.status ?? '1') === '0') return { ok: false, reason: 'This account is disabled.' };

  await db
    .collection('admin')
    .updateOne({ _id: admin._id }, { $set: { last_login: new Date() } })
    .catch(() => {});

  return {
    ok: true,
    user: {
      id: String(admin._id),
      email: String(admin.email),
      username: String(admin.username ?? admin.email),
      role: String(admin.role ?? 'user'),
    },
  };
}

/** The signed-in user for the current request, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
