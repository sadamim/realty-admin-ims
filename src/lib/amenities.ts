// src/lib/amenities.ts
// SERVER ONLY.
//
// `amenities` is an imported collection keyed by the legacy string `am_id`.
// microsite_detail.am_id holds a COMMA-SEPARATED list of those ids, so an
// amenity created here takes the next number in the sequence and a deleted one
// has to be pulled out of every project's list — which is what deleteAmenity
// does rather than leaving dangling ids behind.
import { ObjectId, type Document, type Filter } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { resolveImageSrc } from '@/lib/image-url';
import { csvToList, escapeRegex, nextLegacyId } from '@/lib/legacy-id';

export const AMENITY_COLLECTION = 'amenities';

export interface AmenityRecord {
  _id: string;
  am_id: string;
  name: string;
  image: string;
  imageSrc: string | null;
  category: string;
  projectCount: number;
}

const first = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
};

export function normaliseAmenity(doc: Document, projectCount = 0): AmenityRecord {
  const image = first(doc.image, doc.icon, doc.am_image);
  return {
    _id: String(doc._id),
    am_id: String(doc.am_id ?? ''),
    name: first(doc.name, doc.am_name, doc.title, 'Unnamed amenity'),
    image,
    // Imported icons are bare filenames under /images/amenities/ on the old CDN.
    imageSrc: resolveImageSrc(image, 'amenities'),
    category: first(doc.category),
    projectCount,
  };
}

export interface AmenityInput {
  name: string;
  image?: string | null;
  category?: string;
}

function buildSet(input: AmenityInput) {
  const name = String(input.name ?? '').trim();
  if (!name) throw new Error('An amenity name is required.');
  return {
    name,
    image: input.image ? String(input.image) : '',
    category: String(input.category ?? '').trim(),
    updatedAt: new Date(),
  };
}

/**
 * How many projects use each amenity. am_id is a CSV string, so this cannot be
 * a $lookup — it is one scan of the id lists, done once for the whole page.
 */
async function countUsage(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db
    .collection('microsite_detail')
    .find({}, { projection: { am_id: 1 } })
    .toArray()
    .catch(() => [] as Document[]);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const id of csvToList(row.am_id)) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function listAmenities(opts: { search?: string } = {}): Promise<AmenityRecord[]> {
  const db = await getDb();

  const filter: Filter<Document> = {};
  if (opts.search?.trim()) {
    filter.name = new RegExp(escapeRegex(opts.search.trim()), 'i');
  }

  const [docs, counts] = await Promise.all([
    db.collection(AMENITY_COLLECTION).find(filter).sort({ name: 1 }).toArray(),
    countUsage(),
  ]);

  return docs.map((doc) => normaliseAmenity(doc, counts[String(doc.am_id ?? '')] ?? 0));
}

export async function getAmenity(id: string): Promise<AmenityRecord | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(AMENITY_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  // The editor warns how many projects a delete would rewrite, so the count has
  // to be real here too rather than defaulting to zero.
  const amId = String(doc.am_id ?? '');
  const used = amId
    ? await db
        .collection('microsite_detail')
        .countDocuments({ am_id: new RegExp(`(^|,)\\s*${escapeRegex(amId)}\\s*(,|$)`) })
        .catch(() => 0)
    : 0;

  return normaliseAmenity(doc, used);
}

export async function createAmenity(input: AmenityInput) {
  const db = await getDb();
  const set = buildSet(input);
  const amId = await nextLegacyId(db, AMENITY_COLLECTION, 'am_id');

  const result = await db
    .collection(AMENITY_COLLECTION)
    .insertOne({ am_id: amId, ...set, createdAt: new Date() });

  return { ok: true, id: String(result.insertedId), am_id: amId };
}

export async function updateAmenity(id: string, input: AmenityInput) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();

  const result = await db
    .collection(AMENITY_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: buildSet(input) });
  if (result.matchedCount === 0) throw new Error('Amenity not found');

  return { ok: true };
}

/**
 * Removing an amenity also removes its id from every project's CSV list, so no
 * project is left pointing at something that no longer exists. Rewriting the
 * lists one document at a time is fine: only the affected rows are touched.
 */
export async function deleteAmenity(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();

  const doc = await db.collection(AMENITY_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error('Amenity not found');

  const amId = String(doc.am_id ?? '');
  let cleaned = 0;

  if (amId) {
    const affected = await db
      .collection('microsite_detail')
      .find({ am_id: new RegExp(`(^|,)\\s*${escapeRegex(amId)}\\s*(,|$)`) }, { projection: { am_id: 1 } })
      .toArray();

    for (const row of affected) {
      const remaining = csvToList(row.am_id).filter((value) => value !== amId);
      await db
        .collection('microsite_detail')
        .updateOne({ _id: row._id }, { $set: { am_id: remaining.join(',') } });
      cleaned += 1;
    }
  }

  await db.collection(AMENITY_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { ok: true, cleaned };
}
