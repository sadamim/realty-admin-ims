// src/lib/media.ts
// SERVER ONLY.
//
// Images live in MongoDB, in a `media` collection, because both this panel and
// the public site deploy to Vercel where the filesystem is read-only and
// nothing can be written into public/. Each app serves bytes from its own
// /api/media/[id] route, so an image reference is stored as the relative path
// "/api/media/<id>" and resolves correctly in whichever app renders it.
import { ObjectId, type Filter, type Document } from 'mongodb';
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
  MEDIA_FOLDER_LABELS,
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

export async function listMedia(opts: {
  page?: number;
  limit?: number;
  folder?: string;
  search?: string;
} = {}) {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 24));

  const filter: Filter<Document> = {};
  if (opts.folder && MEDIA_FOLDERS.includes(opts.folder as MediaFolder)) {
    filter.folder = opts.folder;
  }
  if (opts.search?.trim()) {
    const rx = new RegExp(opts.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ filename: rx }, { alt: rx }];
  }

  const collection = db.collection(MEDIA_COLLECTION);
  const total = await collection.countDocuments(filter);
  const docs = await collection
    .find(filter, { projection: { data: 0 } }) // never pull the bytes into a list
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    items: docs.map(toRecord),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function countMedia(): Promise<number> {
  const db = await getDb();
  return db.collection(MEDIA_COLLECTION).countDocuments().catch(() => 0);
}

// Every place an uploaded image can be referenced. Adding a section here is
// all it takes for the media library to warn before deleting one of its images.
const USAGE_SOURCES: Array<{
  collection: string;
  field: string;
  label: string;
  title: string;
  fallback: string;
}> = [
  { collection: 'blog', field: 'image', label: 'Blog', title: 'title', fallback: 'untitled post' },
  { collection: 'banner', field: 'image', label: 'Banner', title: 'title', fallback: 'untitled slide' },
  { collection: 'builder', field: 'logo', label: 'Builder', title: 'name', fallback: 'unnamed builder' },
  { collection: 'amenities', field: 'image', label: 'Amenity', title: 'name', fallback: 'unnamed amenity' },
  { collection: 'testimonial', field: 'image', label: 'Testimonial', title: 'name', fallback: 'unnamed' },
  { collection: 'team', field: 'image', label: 'Team', title: 'name', fallback: 'unnamed' },
  {
    collection: 'microsite_detail',
    field: 'featured_image',
    label: 'Project',
    title: 'micro_id',
    fallback: 'project',
  },
];

const usageLabel = (
  source: (typeof USAGE_SOURCES)[number],
  doc: Document,
) => {
  const name = String(doc[source.title] ?? '').trim() || source.fallback;
  return source.collection === 'microsite_detail'
    ? `${source.label}: #${name}`
    : `${source.label}: ${name}`;
};

/** Where an image is referenced, so the UI can warn before deleting. */
export async function findMediaUsage(id: string): Promise<string[]> {
  const db = await getDb();
  const url = mediaUrl(id);

  const results = await Promise.all(
    USAGE_SOURCES.map(async (source) =>
      db
        .collection(source.collection)
        .find({ [source.field]: url }, { projection: { [source.title]: 1 } })
        .limit(10)
        .toArray()
        .then((docs) => docs.map((doc) => usageLabel(source, doc)))
        .catch(() => [] as string[]),
    ),
  );

  return results.flat();
}

/** Usage for a whole page of media in one query per source rather than 2N. */
export async function findUsageForMany(urls: string[]): Promise<Record<string, string[]>> {
  if (urls.length === 0) return {};
  const db = await getDb();

  const usage: Record<string, string[]> = {};

  const batches = await Promise.all(
    USAGE_SOURCES.map(async (source) =>
      db
        .collection(source.collection)
        .find(
          { [source.field]: { $in: urls } },
          { projection: { [source.field]: 1, [source.title]: 1 } },
        )
        .toArray()
        .then((docs) => ({ source, docs }))
        .catch(() => ({ source, docs: [] as Document[] })),
    ),
  );

  for (const { source, docs } of batches) {
    for (const doc of docs) {
      const url = String(doc[source.field] ?? '');
      if (!url) continue;
      (usage[url] ??= []).push(usageLabel(source, doc));
    }
  }

  return usage;
}

export async function deleteMedia(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db.collection(MEDIA_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}
