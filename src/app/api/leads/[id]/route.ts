import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { setLeadHandled } from '@/lib/leads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await guard('leads.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();
    return NextResponse.json(
      await setLeadHandled(id, body.handled === true, user?.email ?? ''),
    );
  } catch (error) {
    console.error('[api/leads/:id PATCH]', error);
    return failed(error);
  }
}
