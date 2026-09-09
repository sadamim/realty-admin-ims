import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { deleteAdmin, resetAdminPassword, updateAdmin } from '@/lib/admins';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await guard('users.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await updateAdmin(id, await request.json(), user?.id ?? ''));
  } catch (error) {
    console.error('[api/admins/:id PUT]', error);
    return failed(error);
  }
}

/** Password reset, kept separate from the profile update. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await guard();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();

    // Anyone may reset their OWN password; resetting someone else's needs
    // account-management permission.
    if (user?.id !== id) {
      const elevated = await guard('users.write');
      if (elevated.denied) return elevated.denied;
    }

    return NextResponse.json(await resetAdminPassword(id, String(body.password ?? '')));
  } catch (error) {
    console.error('[api/admins/:id PATCH]', error);
    return failed(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, denied } = await guard('users.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    return NextResponse.json(await deleteAdmin(id, user?.id ?? ''));
  } catch (error) {
    console.error('[api/admins/:id DELETE]', error);
    return failed(error);
  }
}
