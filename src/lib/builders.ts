// src/lib/builders.ts
// SERVER ONLY.
//
// The `builder` collection came from the MySQL dump: every row has a legacy
// string PK in `builder_id`, and microsite_detail.builder_id points at it. A
// builder created here gets the next number in that sequence so projects can
// link to it exactly as they link to an imported one.
//
// Writes only ever $set the fields below, so any legacy column the import left
// on a document survives untouched.
import { ObjectId, type Document, type Filter } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { resolveImageSrc } from '@/lib/image-url';
import { csvToList, escapeRegex, listToCsv, nextLegacyId, slugify } from '@/lib/legacy-id';

export const BUILDER_COLLECTION = 'builder';

export interface BuilderRecord {
  _id: string;
  builder_id: string;
  name: string;
  slug: string;
  logo: string;
  logoSrc: string | null;
  address: string;
  description: string;
  established: string;
  completedProjects: string;
  ongoingProjects: string;
  locations: string[];
  website: string;
  active: boolean;
  projectCount: number;
  metaTitle: string;
  metaDescription: string;
}

const first = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
};

export function normaliseBuilder(doc: Document, projectCount = 0): BuilderRecord {
  const name = first(doc.name, doc.builder_name, doc.title, 'Unnamed builder');
  const logo = first(doc.logo, doc.image, doc.builder_logo);

  return {
    _id: String(doc._id),
    builder_id: String(doc.builder_id ?? ''),
    name,
    slug: first(doc.slug) || slugify(name),
    logo,
    // Imported logos are bare filenames under /images/builder/ on the old CDN.
    logoSrc: resolveImageSrc(logo, 'builder'),
    address: first(doc.address, doc.location),
    description: first(doc.description, doc.about, doc.builder_description),
    established: first(doc.established, doc.since, doc.established_year),
    completedProjects: first(doc.completedProjects, doc.completed_projects),
    ongoingProjects: first(doc.ongoingProjects, doc.ongoing_projects),
    locations: csvToList(doc.locations ?? doc.cities),
    website: first(doc.website, doc.url),
    // Imported rows have no `active` flag and were all live, so only an
    // explicit false hides one.
    active: doc.active !== false,
    projectCount,
    metaTitle: first(doc.metaTitle),
    metaDescription: first(doc.metaDescription),
  };
}

export interface BuilderInput {
  name: string;
  slug?: string;
  logo?: string | null;
  address?: string;
  description?: string;
  established?: string;
  completedProjects?: string;
  ongoingProjects?: string;
  locations?: string | string[];
  website?: string;
  active?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

function buildSet(input: BuilderInput) {
  const name = String(input.name ?? '').trim();
  if (!name) throw new Error('A builder name is required.');

  return {
    name,
    slug: slugify(input.slug || name),
    logo: input.logo ? String(input.logo) : '',
    address: String(input.address ?? '').trim(),
    description: String(input.description ?? '').trim(),
    established: String(input.established ?? '').trim(),
    completedProjects: String(input.completedProjects ?? '').trim(),
    ongoingProjects: String(input.ongoingProjects ?? '').trim(),
    locations: listToCsv(input.locations),
    website: String(input.website ?? '').trim(),
    active: input.active !== false,
    metaTitle: String(input.metaTitle ?? '').trim().slice(0, 70),
    metaDescription: String(input.metaDescription ?? '').trim().slice(0, 160),
    updatedAt: new Date(),
  };
}

/** Project counts for a page of builders, in one query rather than one each. */
async function countProjects(builderIds: string[]): Promise<Record<string, number>> {
  if (builderIds.length === 0) return {};
  const db = await getDb();
  const rows = await db
    .collection('microsite_detail')
    .aggregate([
      { $match: { builder_id: { $in: builderIds } } },
      { $group: { _id: '$builder_id', n: { $sum: 1 } } },
    ])
    .toArray();

  const counts: Record<string, number> = {};
  for (const row of rows) counts[String(row._id)] = Number(row.n ?? 0);
  return counts;
}

export async function listBuilders(
  opts: { page?: number; limit?: number; search?: string } = {},
) {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 20));

  const filter: Filter<Document> = {};
  if (opts.search?.trim()) {
    filter.name = new RegExp(escapeRegex(opts.search.trim()), 'i');
  }

  const collection = db.collection(BUILDER_COLLECTION);
  const total = await collection.countDocuments(filter);
  const docs = await collection
    .find(filter)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const counts = await countProjects(docs.map((doc) => String(doc.builder_id ?? '')));

  return {
    items: docs.map((doc) => normaliseBuilder(doc, counts[String(doc.builder_id ?? '')] ?? 0)),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getBuilder(id: string): Promise<BuilderRecord | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(BUILDER_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  const counts = await countProjects([String(doc.builder_id ?? '')]);
  return normaliseBuilder(doc, counts[String(doc.builder_id ?? '')] ?? 0);
}

export async function createBuilder(input: BuilderInput) {
  const db = await getDb();
  const set = buildSet(input);
  const builderId = await nextLegacyId(db, BUILDER_COLLECTION, 'builder_id');

  const result = await db.collection(BUILDER_COLLECTION).insertOne({
    builder_id: builderId,
    ...set,
    createdAt: new Date(),
  });

  return { ok: true, id: String(result.insertedId), builder_id: builderId };
}

export async function updateBuilder(id: string, input: BuilderInput) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();

  const result = await db
    .collection(BUILDER_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: buildSet(input) });
  if (result.matchedCount === 0) throw new Error('Builder not found');

  return { ok: true };
}

/**
 * Deleting a builder that projects still point at would orphan them — the
 * lookup in the project list would simply return nothing and every affected
 * card would lose its builder name. So the count is checked first.
 */
export async function deleteBuilder(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();

  const doc = await db.collection(BUILDER_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error('Builder not found');

  const inUse = await db
    .collection('microsite_detail')
    .countDocuments({ builder_id: String(doc.builder_id ?? '') });

  if (inUse > 0) {
    throw new Error(
      `${inUse} project${inUse === 1 ? '' : 's'} still link to this builder. Reassign them first, or hide the builder instead.`,
    );
  }

  await db.collection(BUILDER_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}

/** Every builder, id + name only — for the project form's builder dropdown. */
export async function builderOptions() {
  const db = await getDb();
  const docs = await db
    .collection(BUILDER_COLLECTION)
    .find({}, { projection: { builder_id: 1, name: 1 } })
    .sort({ name: 1 })
    .toArray();
  return docs.map((doc) => ({
    builder_id: String(doc.builder_id ?? ''),
    name: String(doc.name ?? ''),
  }));
}
