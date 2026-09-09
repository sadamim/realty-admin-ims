import { NextResponse } from 'next/server';
import { guard, failed } from '@/lib/api-guard';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, saveMedia, type MediaFolder } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Multipart upload. The browser downscales first, so this is the backstop. */
export async function POST(request: Request) {
  const { user, denied } = await guard('content.write');
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, GIF and AVIF images are accepted.' },
        { status: 415 },
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Image is larger than 4 MB.' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const media = await saveMedia({
      bytes,
      filename: file.name || 'upload',
      contentType: file.type,
      folder: (String(form.get('folder') ?? 'general') as MediaFolder) ?? 'general',
      alt: String(form.get('alt') ?? ''),
      uploadedBy: user?.email ?? '',
    });

    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error('[api/media POST]', error);
    return failed(error);
  }
}
