// src/lib/testimonials.ts
// SERVER ONLY.
//
// A NEW collection (`testimonial`). Nothing imported reads or writes it, so
// adding it cannot disturb the migrated data, and an empty collection simply
// means the website skips the section entirely.
import type { Document } from 'mongodb';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { resolveImageSrc } from '@/lib/image-url';
import { findAllOrdered, findById, nextOrder, text } from '@/lib/ordered';

export const TESTIMONIAL_COLLECTION = 'testimonial';

export interface TestimonialRecord {
  _id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  image: string | null;
  imageSrc: string | null;
  rating: number;
  project: string;
  order: number;
  active: boolean;
  updatedAt: string | null;
}

export interface TestimonialInput {
  name: string;
  role?: string;
  location?: string;
  quote?: string;
  image?: string | null;
  rating?: number | string;
  project?: string;
  active?: boolean;
}

function normalise(doc: Document): TestimonialRecord {
  const image = String(doc.image ?? '').trim() || null;
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ''),
    role: String(doc.role ?? ''),
    location: String(doc.location ?? ''),
    quote: String(doc.quote ?? ''),
    image,
    imageSrc: resolveImageSrc(image, 'testimonial'),
    rating: Math.min(5, Math.max(0, Number(doc.rating ?? 5) || 0)),
    project: String(doc.project ?? ''),
    order: Number(doc.order ?? 0),
    active: doc.active !== false,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

function buildSet(input: TestimonialInput) {
  const name = text(input.name, 120);
  if (!name) throw new Error('A name is required.');

  const quote = text(input.quote, 1200);
  if (!quote) throw new Error('The testimonial text is required.');

  const rating = Number(input.rating ?? 5);

  return {
    name,
    role: text(input.role, 120),
    location: text(input.location, 120),
    quote,
    image: input.image ? String(input.image) : '',
    // A photo is optional; the website falls back to the person's initials.
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
    project: text(input.project, 160),
    active: input.active !== false,
    updatedAt: new Date(),
  };
}

export async function listTestimonials(opts: { activeOnly?: boolean } = {}) {
  return (await findAllOrdered(TESTIMONIAL_COLLECTION, opts)).map(normalise);
}

export async function getTestimonial(id: string): Promise<TestimonialRecord | null> {
  const doc = await findById(TESTIMONIAL_COLLECTION, id);
  return doc ? normalise(doc) : null;
}

export async function createTestimonial(input: TestimonialInput) {
  const db = await getDb();
  const result = await db.collection(TESTIMONIAL_COLLECTION).insertOne({
    ...buildSet(input),
    order: await nextOrder(TESTIMONIAL_COLLECTION),
    createdAt: new Date(),
  });
  return { ok: true, id: String(result.insertedId) };
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const result = await db
    .collection(TESTIMONIAL_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: buildSet(input) });
  if (result.matchedCount === 0) throw new Error('Testimonial not found');
  return { ok: true };
}
