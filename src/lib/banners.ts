// src/lib/banners.ts
// SERVER ONLY.
//
// Homepage hero slides. This is a NEW collection (`banner`) — nothing existing
// reads or writes it, so adding it cannot disturb the imported data. When the
// collection is empty the public site falls back to its current static hero.
import { ObjectId, type Document } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { resolveImageSrc } from '@/lib/media';

export const BANNER_COLLECTION = 'banner';

export interface BannerRecord {
  _id: string;
  title: string;
  subtitle: string;
  image: string | null;
  imageSrc: string | null;
  ctaLabel: string;
  ctaHref: string;
  order: number;
  active: boolean;
  updatedAt: string | null;
}

export interface BannerInput {
  title?: string;
  subtitle?: string;
  image?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
  order?: number;
  active?: boolean;
}

function normalise(doc: Document): BannerRecord {
  const image = String(doc.image ?? '').trim() || null;
  return {
    _id: String(doc._id),
    title: String(doc.title ?? ''),
    subtitle: String(doc.subtitle ?? ''),
    image,
    imageSrc: resolveImageSrc(image, 'banner'),
    ctaLabel: String(doc.ctaLabel ?? ''),
    ctaHref: String(doc.ctaHref ?? ''),
    order: Number(doc.order ?? 0),
    active: doc.active !== false,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

function buildSet(input: BannerInput) {
  const image = String(input.image ?? '').trim();
  if (!image) throw new Error('A banner image is required.');

  return {
    title: String(input.title ?? '').trim(),
    subtitle: String(input.subtitle ?? '').trim(),
    image,
    ctaLabel: String(input.ctaLabel ?? '').trim(),
    ctaHref: String(input.ctaHref ?? '').trim(),
    active: input.active !== false,
    updatedAt: new Date(),
  };
}

export async function listBanners(opts: { activeOnly?: boolean } = {}): Promise<BannerRecord[]> {
  const db = await getDb();
  const filter = opts.activeOnly ? { active: { $ne: false } } : {};
  const docs = await db
    .collection(BANNER_COLLECTION)
    .find(filter)
    .sort({ order: 1, _id: 1 })
    .toArray()
    .catch(() => [] as Document[]);
  return docs.map(normalise);
}

export async function countBanners(): Promise<number> {
  const db = await getDb();
  return db.collection(BANNER_COLLECTION).countDocuments().catch(() => 0);
}

export async function getBanner(id: string): Promise<BannerRecord | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(BANNER_COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? normalise(doc) : null;
}

export async function createBanner(input: BannerInput) {
  const db = await getDb();
  const collection = db.collection(BANNER_COLLECTION);
  const last = await collection.find({}).sort({ order: -1 }).limit(1).toArray();
  const order = last.length ? Number(last[0].order ?? 0) + 1 : 0;

  const result = await collection.insertOne({
    ...buildSet(input),
    order,
    createdAt: new Date(),
  });
  return { ok: true, id: String(result.insertedId) };
}

export async function updateBanner(id: string, input: BannerInput) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const result = await db
    .collection(BANNER_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: buildSet(input) });
  if (result.matchedCount === 0) throw new Error('Banner not found');
  return { ok: true };
}

/** Toggle without touching anything else on the document. */
export async function setBannerActive(id: string, active: boolean) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db
    .collection(BANNER_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: { active, updatedAt: new Date() } });
  return { ok: true };
}

/** Move one slide up or down by swapping order values with its neighbour. */
export async function moveBanner(id: string, direction: 'up' | 'down') {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const collection = db.collection(BANNER_COLLECTION);

  const all = await collection.find({}).sort({ order: 1, _id: 1 }).toArray();
  const index = all.findIndex((doc) => String(doc._id) === id);
  if (index === -1) throw new Error('Banner not found');

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= all.length) return { ok: true };

  // Rewrite the whole ordering: cheap (a handful of slides) and self-healing
  // if legacy rows ever ended up sharing an order value.
  const reordered = [...all];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(target, 0, moved);

  await Promise.all(
    reordered.map((doc, position) =>
      collection.updateOne({ _id: doc._id }, { $set: { order: position } }),
    ),
  );
  return { ok: true };
}

export async function deleteBanner(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db.collection(BANNER_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}
