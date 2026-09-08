import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateMicrosite } from '@/lib/admin-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // middleware already gates this, but re-check: never trust a single layer.
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { id } = await params;
    const payload = await request.json();
    await updateMicrosite(id, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/microsites/:id PUT]', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
