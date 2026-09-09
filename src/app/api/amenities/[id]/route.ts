import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { deleteAmenity, updateAmenity } from '@/lib/amenities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await updateAmenity(id, await request.json()));
  } catch (error) {
    console.error('[api/amenities/:id PUT]', error);
    return failed(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await deleteAmenity(id));
  } catch (error) {
    console.error('[api/amenities/:id DELETE]', error);
    return failed(error);
  }
}
