import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { createBlog } from '@/lib/blogs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const result = await createBlog(await request.json());
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/blogs POST]', error);
    return failed(error);
  }
}
