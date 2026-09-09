import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { deleteMedia, getMediaBytes } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serves the image bytes. Still behind the session cookie inside the panel —
 * middleware is unchanged — which is fine because the browser sends the cookie
 * with <img> requests. The public site has its own copy of this route for
 * anonymous visitors.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await getMediaBytes(id);
  if (!media) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(media.bytes), {
    headers: {
      'Content-Type': media.contentType,
      'Content-Length': String(media.bytes.length),
      // Ids are immutable, so this can be cached hard.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteMedia(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/media/:id DELETE]', error);
    return failed(error);
  }
}
