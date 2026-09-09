import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { updateTestimonial, TESTIMONIAL_COLLECTION } from '@/lib/testimonials';
import { move, removeById, setActive } from '@/lib/ordered';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await updateTestimonial(id, await request.json()));
  } catch (error) {
    console.error('[api/testimonials/:id PUT]', error);
    return failed(error);
  }
}

/** Visibility and ordering, changed straight from the list screen. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'move' && (body.direction === 'up' || body.direction === 'down')) {
      return NextResponse.json(await move(TESTIMONIAL_COLLECTION, id, body.direction));
    }
    if (typeof body.active === 'boolean') {
      return NextResponse.json(await setActive(TESTIMONIAL_COLLECTION, id, body.active));
    }
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  } catch (error) {
    console.error('[api/testimonials/:id PATCH]', error);
    return failed(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await removeById(TESTIMONIAL_COLLECTION, id));
  } catch (error) {
    console.error('[api/testimonials/:id DELETE]', error);
    return failed(error);
  }
}
