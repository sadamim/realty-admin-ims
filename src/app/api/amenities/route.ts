import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { createAmenity } from '@/lib/amenities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    return NextResponse.json(await createAmenity(await request.json()));
  } catch (error) {
    console.error('[api/amenities POST]', error);
    return failed(error);
  }
}
