// src/lib/media.ts
// SERVER ONLY.
//
// Images live in MongoDB, in a `media` collection, because both this panel and
// the public site deploy to Vercel where the filesystem is read-only and
// nothing can be written into public/. Each app serves bytes from its own
// /api/media/[id] route, so an image reference is stored as the relative path
// "/api/media/<id>" and resolves correctly in whichever app renders it.
import { ObjectId, type Document } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { mediaUrl, MEDIA_FOLDERS, type MediaFolder } from '@/lib/image-url';

// Re-exported so existing server imports keep working; the definitions now
// live in a client-safe module.
export {
  mediaUrl,
  resolveImageSrc,
  isUploadedMedia,
  LEGACY_IMAGE_BASE,
  MEDIA_FOLDERS,
  LEGACY_FOLDER_FOR,
} from '@/lib/image-url';
export type { MediaFolder } from '@/lib/image-url';

export const MEDIA_COLLECTION = 'media';

/** 4 MB. The client downscales before upload, so this is a backstop. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export interface MediaRecord {
  _id: string;
  filename: string;
  contentType: string;
  size: number;
  folder: MediaFolder;
  alt: string;
  uploadedBy: string;
  createdAt: string | null;
  url: string;
}

function toRecord(doc: Document): MediaRecord {
  return {
    _id: String(doc._id),
    filename: String(doc.filename ?? 'image'),
    contentType: String(doc.contentType ?? 'application/octet-stream'),
    size: Number(doc.size ?? 0),
    folder: (doc.folder ?? 'general') as MediaFolder,
    alt: String(doc.alt ?? ''),
    uploadedBy: String(doc.uploadedBy ?? ''),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    url: mediaUrl(doc._id),
  };
}

export async function saveMedia(input: {
  bytes: Buffer;
  filename: string;
  contentType: string;
  folder?: MediaFolder;
  alt?: string;
  uploadedBy?: string;
}): Promise<MediaRecord> {
  if (!ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error(`Unsupported image type: ${input.contentType}`);
  }
  if (input.bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image is larger than 4 MB.');
  }

  // An unrecognised folder would quietly break the library's filters, so it
  // falls back to 'general' rather than being stored as typed.
  const folder: MediaFolder =
    input.folder && MEDIA_FOLDERS.includes(input.folder) ? input.folder : 'general';

  const db = await getDb();
  const doc = {
    filename: input.filename.slice(0, 200),
    contentType: input.contentType,
    size: input.bytes.length,
    folder,
    alt: (input.alt ?? '').slice(0, 300),
    uploadedBy: input.uploadedBy ?? '',
    data: input.bytes,
    createdAt: new Date(),
  };

  const result = await db.collection(MEDIA_COLLECTION).insertOne(doc);
  return toRecord({ ...doc, _id: result.insertedId });
}

/** Bytes for the serving route. Returns null for an unknown or invalid id. */
export async function getMediaBytes(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(MEDIA_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  const raw = doc.data as unknown as { buffer?: Buffer } | Buffer | undefined;
  const buffer: Buffer | null = Buffer.isBuffer(raw)
    ? raw
    : raw && 'buffer' in raw && raw.buffer
      ? Buffer.from(raw.buffer)
      : null;
  if (!buffer) return null;

  return {
    bytes: buffer,
    contentType: String(doc.contentType ?? 'application/octet-stream'),
    size: Number(doc.size ?? buffer.length),
  };
}

// deleteMedia stays reachable through DELETE /api/media/[id]. The browsable
// library screen that used to call it was removed; uploading, serving and
// deleting by id all still work.
export async function deleteMedia(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db.collection(MEDIA_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}
