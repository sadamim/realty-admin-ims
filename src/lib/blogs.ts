// src/lib/blogs.ts
// SERVER ONLY.
//
// The `blog` collection came over from the MySQL dump, so existing rows may use
// legacy column names. Reads are tolerant — every known alias is mapped onto a
// canonical shape — while writes only ever $set the canonical fields, leaving
// any other legacy columns on the document untouched.
import { ObjectId, type Document, type Filter } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { resolveImageSrc } from '@/lib/media';

export const BLOG_COLLECTION = 'blog';

export type BlogStatus = 'published' | 'draft';

export interface BlogRecord {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image: string | null;
  imageSrc: string | null;
  category: string;
  author: string;
  status: BlogStatus;
  readTime: string;
  publishedAt: string | null;
  updatedAt: string | null;
  /** SEO overrides. Empty means the title and excerpt describe the page. */
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

export const escapeRegex = (value: string) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function slugify(value: string): string {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

/** Rough reading time from the body text. */
export function readingTime(body: string): string {
  const words = String(body ?? '')
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normaliseBlog(doc: Document): BlogRecord {
  const title = first(doc.title, doc.blog_title, doc.heading, doc.name, 'Untitled post');
  const body = first(doc.body, doc.content, doc.blog_content, doc.description, doc.blog_description);
  const image = first(doc.image, doc.blog_image, doc.featured_image, doc.thumbnail) || null;
  const published = toDate(doc.publishedAt ?? doc.date ?? doc.blog_date ?? doc.created_date ?? doc.createdAt);

  // Anything imported without an explicit status is treated as published,
  // because that is what it was on the old site.
  const rawStatus = first(doc.status, doc.blog_status).toLowerCase();
  const status: BlogStatus = rawStatus === 'draft' || rawStatus === '0' ? 'draft' : 'published';

  const excerpt =
    first(doc.excerpt, doc.short_description, doc.short_desc, doc.summary) ||
    body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);

  return {
    _id: String(doc._id),
    title,
    slug: first(doc.slug, doc.blog_slug) || slugify(title),
    excerpt,
    body,
    image,
    imageSrc: resolveImageSrc(image, 'blog'),
    category: first(doc.category, doc.blog_category, doc.category_name, 'General'),
    author: first(doc.author, doc.posted_by, doc.created_by, 'RealtyFocus Team'),
    status,
    readTime: first(doc.readTime) || readingTime(body),
    publishedAt: published ? published.toISOString() : null,
    updatedAt: toDate(doc.updatedAt)?.toISOString() ?? null,
    metaTitle: first(doc.metaTitle),
    metaDescription: first(doc.metaDescription),
  };
}

export interface BlogInput {
  title: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  image?: string | null;
  category?: string;
  author?: string;
  status?: BlogStatus;
  publishedAt?: string | null;
  metaTitle?: string;
  metaDescription?: string;
}

/** Only these keys are ever written. Unknown legacy columns are left alone. */
function buildSet(input: BlogInput) {
  const title = String(input.title ?? '').trim();
  if (!title) throw new Error('A title is required.');

  const body = String(input.body ?? '');
  const published = toDate(input.publishedAt) ?? new Date();

  return {
    title,
    slug: slugify(input.slug || title),
    excerpt: String(input.excerpt ?? '').trim(),
    body,
    image: input.image ? String(input.image) : '',
    category: String(input.category ?? '').trim() || 'General',
    author: String(input.author ?? '').trim() || 'RealtyFocus Team',
    status: input.status === 'draft' ? 'draft' : 'published',
    readTime: readingTime(body),
    publishedAt: published,
    metaTitle: String(input.metaTitle ?? '').trim().slice(0, 70),
    metaDescription: String(input.metaDescription ?? '').trim().slice(0, 160),
    updatedAt: new Date(),
  };
}

export async function listBlogs(opts: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
} = {}) {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 20));

  const filter: Filter<Document> = {};
  const and: Filter<Document>[] = [];

  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegex(opts.search.trim()), 'i');
    and.push({ $or: [{ title: rx }, { blog_title: rx }, { category: rx }, { author: rx }] });
  }
  // Posts written here use status "draft"; rows imported from MySQL used "0".
  // Both count as hidden, and both filters must agree with the public site.
  if (opts.status === 'draft') and.push({ status: { $in: ['draft', '0', 0] } });
  if (opts.status === 'published') and.push({ status: { $nin: ['draft', '0', 0] } });
  if (opts.category) {
    and.push({ category: new RegExp(`^${escapeRegex(opts.category)}$`, 'i') });
  }
  if (and.length) filter.$and = and;

  const collection = db.collection(BLOG_COLLECTION);
  const total = await collection.countDocuments(filter);
  const docs = await collection
    .find(filter)
    .sort({ publishedAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    items: docs.map(normaliseBlog),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listBlogCategories(): Promise<string[]> {
  const db = await getDb();
  const values = await db
    .collection(BLOG_COLLECTION)
    .distinct('category')
    .catch(() => [] as unknown[]);
  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export async function getBlog(id: string): Promise<BlogRecord | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection(BLOG_COLLECTION).findOne({ _id: new ObjectId(id) });
  return doc ? normaliseBlog(doc) : null;
}

/** Slugs are unique; a clash gets a numeric suffix. */
async function uniqueSlug(slug: string, excludeId?: string) {
  const db = await getDb();
  const collection = db.collection(BLOG_COLLECTION);
  let candidate = slug || 'post';
  let n = 1;

  for (;;) {
    const clash = await collection.findOne({ slug: candidate }, { projection: { _id: 1 } });
    if (!clash || (excludeId && String(clash._id) === excludeId)) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

export async function createBlog(input: BlogInput) {
  const db = await getDb();
  const set = buildSet(input);
  set.slug = await uniqueSlug(set.slug);

  const result = await db
    .collection(BLOG_COLLECTION)
    .insertOne({ ...set, createdAt: new Date() });
  return { ok: true, id: String(result.insertedId), slug: set.slug };
}

export async function updateBlog(id: string, input: BlogInput) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const set = buildSet(input);
  set.slug = await uniqueSlug(set.slug, id);

  const result = await db
    .collection(BLOG_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: set });
  if (result.matchedCount === 0) throw new Error('Post not found');
  return { ok: true, slug: set.slug };
}

export async function deleteBlog(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db.collection(BLOG_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}
