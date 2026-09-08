import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

// bcrypt needs the Node runtime, not Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const result = await verifyCredentials(String(email ?? ''), String(password ?? ''));

    if (!result.ok || !result.user) {
      // Deliberately vague, and the same for "no such user" and "wrong
      // password" — otherwise this endpoint enumerates valid admin emails.
      return NextResponse.json({ error: result.reason ?? 'Invalid email or password.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, user: result.user });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(result.user), sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('[auth/login]', error);
    return NextResponse.json({ error: 'Login failed. Check the server logs.' }, { status: 500 });
  }
}
