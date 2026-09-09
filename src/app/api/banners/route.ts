import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { createBanner } from '@/lib/banners';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    return NextResponse.json(await createBanner(await request.json()));
  } catch (error) {
    console.error('[api/banners POST]', error);
    return failed(error);
  }
}
