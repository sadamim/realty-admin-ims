import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { deleteBuilder, updateBuilder } from '@/lib/builders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await updateBuilder(id, await request.json()));
  } catch (error) {
    console.error('[api/builders/:id PUT]', error);
    return failed(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await deleteBuilder(id));
  } catch (error) {
    // A builder still linked to projects is refused with 409 so the UI can say
    // why rather than showing a generic failure.
    console.error('[api/builders/:id DELETE]', error);
    return failed(error, 409);
  }
}
