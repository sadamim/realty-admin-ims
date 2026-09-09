import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { createAdmin } from '@/lib/admins';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { denied } = await guard('users.write');
  if (denied) return denied;

  try {
    return NextResponse.json(await createAdmin(await request.json()));
  } catch (error) {
    console.error('[api/admins POST]', error);
    return failed(error);
  }
}
