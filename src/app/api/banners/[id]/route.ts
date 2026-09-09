import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { deleteBanner, moveBanner, setBannerActive, updateBanner } from '@/lib/banners';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await updateBanner(id, await request.json()));
  } catch (error) {
    console.error('[api/banners/:id PUT]', error);
    return failed(error);
  }
}

/** Small state changes from the list screen: visibility and ordering. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'move' && (body.direction === 'up' || body.direction === 'down')) {
      return NextResponse.json(await moveBanner(id, body.direction));
    }
    if (typeof body.active === 'boolean') {
      return NextResponse.json(await setBannerActive(id, body.active));
    }
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  } catch (error) {
    console.error('[api/banners/:id PATCH]', error);
    return failed(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await deleteBanner(id));
  } catch (error) {
    console.error('[api/banners/:id DELETE]', error);
    return failed(error);
  }
}
