import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { createBuilder } from '@/lib/builders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    return NextResponse.json(await createBuilder(await request.json()));
  } catch (error) {
    console.error('[api/builders POST]', error);
    return failed(error);
  }
}
