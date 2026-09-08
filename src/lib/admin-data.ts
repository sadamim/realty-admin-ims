// src/lib/admin-data.ts
// SERVER ONLY.
//
// ---------------------------------------------------------------------------
// How this data is shaped — read this before writing a query
// ---------------------------------------------------------------------------
// The collections were imported verbatim from MySQL. Every document has a new
// ObjectId in `_id`, but relationships still run through the ORIGINAL MySQL
// primary keys, stored as STRINGS under their own names:
//
//   microsite.micro_id          "1"    <- legacy PK (NOT _id)
//   microsite_detail.micro_id   "12"   -> microsite.micro_id
//   microsite_detail.builder_id "6"    -> builder.builder_id
//   microsite_detail.type_id    "17"   -> prop_type.type_id
//   microsite_detail.status_id  "14"   -> prop_status.status_id
//   price.micro_id              "2"    -> microsite.micro_id
//   floor_plan.micro_id         "2"    -> microsite.micro_id
//   amenities.am_id / bankapproval.bank_id / legalapproval.legal_id
//
// Numeric columns (sqft, basic_cost, latitude, ...) are strings too.
// Note the singular, snake_case collection names: `microsite`, not
// `microsites`. Both exist; the pluralised ones are empty shells Mongoose
// created and joining against them returns nothing.
// ---------------------------------------------------------------------------
import { ObjectId } from 'mongodb';
import { getDb, serialize } from '@/lib/mongodb';

export const escapeRegex = (value: string) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const csvToIds = (value: unknown): string[] =>
  String(value ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

export interface Counts {
  microsites: number;
  builders: number;
  prices: number;
  floorPlans: number;
  amenities: number;
  leads: number;
  blogs: number;
  admins: number;
}

export async function getCounts(): Promise<Counts> {
  const db = await getDb();
  const [microsites, builders, prices, floorPlans, amenities, leads, blogs, admins] =
    await Promise.all([
      db.collection('microsite').countDocuments(),
      db.collection('builder').countDocuments(),
      db.collection('price').countDocuments(),
      db.collection('floor_plan').countDocuments(),
      db.collection('amenities').countDocuments(),
      db.collection('leads').countDocuments().catch(() => 0),
      db.collection('blog').countDocuments().catch(() => 0),
      db.collection('admin').countDocuments(),
    ]);
  return { microsites, builders, prices, floorPlans, amenities, leads, blogs, admins };
}

export interface MicrositeRow {
  _id: string;
  micro_id: string;
  name: string;
  location: string;
  city: string;
  project_type: string;
  builder_name: string | null;
  status: string | null;
  type: string | null;
  featured_image: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated microsite list. Filtering and paging run BEFORE the $lookups so
 * only the rows on screen get joined.
 */
export async function listMicrosites(opts: {
  page?: number;
  limit?: number;
  search?: string;
  projectType?: string;
}): Promise<Paged<MicrositeRow>> {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 20));

  const filter: Record<string, unknown> = {};
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegex(opts.search.trim()), 'i');
    filter.$or = [{ name: rx }, { location: rx }, { city: rx }];
  }
  if (opts.projectType) {
    filter.project_type = new RegExp(`^${escapeRegex(opts.projectType)}$`, 'i');
  }

  const total = await db.collection('microsite').countDocuments(filter);

  const items = await db
    .collection('microsite')
    .aggregate([
      { $match: filter },
      { $sort: { _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $addFields: { legacy_id: { $toString: '$micro_id' } } },
      {
        $lookup: {
          from: 'microsite_detail',
          localField: 'legacy_id',
          foreignField: 'micro_id',
          as: 'details',
        },
      },
      // $arrayElemAt, not $unwind: a few microsites have >1 detail row and
      // unwinding duplicates them.
      { $set: { details: { $arrayElemAt: ['$details', 0] } } },
      {
        $lookup: {
          from: 'builder',
          localField: 'details.builder_id',
          foreignField: 'builder_id',
          as: 'builder',
        },
      },
      { $set: { builder: { $arrayElemAt: ['$builder', 0] } } },
      {
        $lookup: {
          from: 'prop_status',
          localField: 'details.status_id',
          foreignField: 'status_id',
          as: 'status',
        },
      },
      { $set: { status: { $arrayElemAt: ['$status', 0] } } },
      {
        $lookup: {
          from: 'prop_type',
          localField: 'details.type_id',
          foreignField: 'type_id',
          as: 'type',
        },
      },
      { $set: { type: { $arrayElemAt: ['$type', 0] } } },
      {
        $project: {
          micro_id: '$legacy_id',
          name: 1,
          location: 1,
          city: 1,
          project_type: 1,
          builder_name: '$builder.name',
          status: '$status.status',
          type: '$type.type',
          featured_image: '$details.featured_image',
        },
      },
    ])
    .toArray();

  return {
    items: serialize(items) as MicrositeRow[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** One microsite plus its detail row and everything hanging off it. */
export async function getMicrosite(id: string) {
  const db = await getDb();
  if (!ObjectId.isValid(id)) return null;

  const microsite = await db.collection('microsite').findOne({ _id: new ObjectId(id) });
  if (!microsite) return null;

  const legacyId = String(microsite.micro_id ?? '');

  const [details, prices, floorPlans, builders, statuses, types] = await Promise.all([
    db.collection('microsite_detail').findOne({ micro_id: legacyId }),
    db.collection('price').find({ micro_id: legacyId }).toArray(),
    db.collection('floor_plan').find({ micro_id: legacyId }).toArray(),
    db.collection('builder').find({}, { projection: { builder_id: 1, name: 1 } }).sort({ name: 1 }).toArray(),
    db.collection('prop_status').find({}).toArray(),
    db.collection('prop_type').find({}).toArray(),
  ]);

  let amenities: Record<string, unknown>[] = [];
  if (details) {
    const amIds = csvToIds(details.am_id);
    if (amIds.length) {
      amenities = await db.collection('amenities').find({ am_id: { $in: amIds } }).toArray();
    }
  }

  return serialize({
    microsite,
    details,
    prices,
    floorPlans,
    amenities,
    options: { builders, statuses, types },
  });
}

/** Fields the edit form is allowed to write. Anything else is ignored. */
const MICROSITE_FIELDS = [
  'name',
  'location',
  'sub_location',
  'city',
  'zone',
  'project_type',
  'rera_no',
  'possession',
  'total_area',
  'no_of_units',
];
const DETAIL_FIELDS = [
  'about',
  'rooms',
  'builder_id',
  'status_id',
  'type_id',
  'address',
  'phone',
  'email',
  'featured_image',
  'latitude',
  'longitude',
  'built_area',
  'price',
];

export async function updateMicrosite(id: string, payload: Record<string, unknown>) {
  const db = await getDb();
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');

  const microsite = await db.collection('microsite').findOne({ _id: new ObjectId(id) });
  if (!microsite) throw new Error('Microsite not found');

  const micrositeSet: Record<string, unknown> = {};
  for (const f of MICROSITE_FIELDS) {
    if (f in payload) micrositeSet[f] = payload[f];
  }

  const detailSet: Record<string, unknown> = {};
  for (const f of DETAIL_FIELDS) {
    if (f in payload) detailSet[f] = payload[f];
  }

  if (Object.keys(micrositeSet).length) {
    micrositeSet.updatedAt = new Date();
    await db.collection('microsite').updateOne({ _id: microsite._id }, { $set: micrositeSet });
  }

  if (Object.keys(detailSet).length) {
    const legacyId = String(microsite.micro_id ?? '');
    detailSet.updatedAt = new Date();
    await db
      .collection('microsite_detail')
      .updateOne({ micro_id: legacyId }, { $set: detailSet }, { upsert: false });
  }

  return { ok: true };
}

export interface BuilderRow {
  _id: string;
  builder_id: string;
  name: string;
  logo: string;
  address: string;
  projectCount: number;
}

export async function listBuilders(opts: { page?: number; limit?: number; search?: string }) {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 20));

  const filter: Record<string, unknown> = {};
  if (opts.search?.trim()) {
    filter.name = new RegExp(escapeRegex(opts.search.trim()), 'i');
  }

  const total = await db.collection('builder').countDocuments(filter);

  const items = await db
    .collection('builder')
    .aggregate([
      { $match: filter },
      { $sort: { name: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'microsite_detail',
          localField: 'builder_id',
          foreignField: 'builder_id',
          as: 'projects',
        },
      },
      {
        $project: {
          builder_id: 1,
          name: 1,
          logo: 1,
          address: 1,
          projectCount: { $size: '$projects' },
        },
      },
    ])
    .toArray();

  return {
    items: serialize(items) as BuilderRow[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listAmenities() {
  const db = await getDb();
  const rows = await db.collection('amenities').find({}).sort({ name: 1 }).toArray();
  return serialize(rows);
}

export async function listAdmins() {
  const db = await getDb();
  const rows = await db
    .collection('admin')
    // Never ship the password field to the browser.
    .find({}, { projection: { password: 0 } })
    .sort({ _id: 1 })
    .toArray();
  return serialize(rows);
}
