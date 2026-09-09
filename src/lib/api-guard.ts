// src/lib/api-guard.ts
// SERVER ONLY. One place for the "is this request allowed" check that every
// new route handler performs. Mirrors the existing pattern in
// /api/microsites/[id]: middleware already gates the route, and the handler
// checks again rather than trusting a single layer.
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { can, type Permission } from '@/lib/permissions';
import type { SessionUser } from '@/lib/session';

export interface Guard {
  user: SessionUser | null;
  denied: NextResponse | null;
}

export async function guard(permission?: Permission): Promise<Guard> {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      denied: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  if (permission && !can(user.role, permission)) {
    return {
      user,
      denied: NextResponse.json(
        { error: 'Your role does not allow that action.' },
        { status: 403 },
      ),
    };
  }

  return { user, denied: null };
}

export const failed = (error: unknown, status = 400) =>
  NextResponse.json({ error: (error as Error)?.message ?? 'Request failed.' }, { status });
