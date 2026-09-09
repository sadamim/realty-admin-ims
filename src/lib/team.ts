// src/lib/team.ts
// SERVER ONLY.
//
// A NEW collection (`team`) for the people shown on the public About page.
// Same rules as testimonials: nothing imported touches it, and an empty
// collection means the website simply does not render the section.
import type { Document } from 'mongodb';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { resolveImageSrc } from '@/lib/image-url';
import { findAllOrdered, findById, nextOrder, text } from '@/lib/ordered';

export const TEAM_COLLECTION = 'team';

export interface TeamRecord {
  _id: string;
  name: string;
  title: string;
  bio: string;
  image: string | null;
  imageSrc: string | null;
  email: string;
  phone: string;
  linkedin: string;
  order: number;
  active: boolean;
  updatedAt: string | null;
}

export interface TeamInput {
  name: string;
  title?: string;
  bio?: string;
  image?: string | null;
  email?: string;
  phone?: string;
  linkedin?: string;
  active?: boolean;
}

function normalise(doc: Document): TeamRecord {
  const image = String(doc.image ?? '').trim() || null;
  return {
    _id: String(doc._id),
    name: String(doc.name ?? ''),
    title: String(doc.title ?? ''),
    bio: String(doc.bio ?? ''),
    image,
    imageSrc: resolveImageSrc(image, 'team'),
    email: String(doc.email ?? ''),
    phone: String(doc.phone ?? ''),
    linkedin: String(doc.linkedin ?? ''),
    order: Number(doc.order ?? 0),
    active: doc.active !== false,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

function buildSet(input: TeamInput) {
  const name = text(input.name, 120);
  if (!name) throw new Error('A name is required.');

  const email = text(input.email, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('That email address does not look right.');
  }

  return {
    name,
    title: text(input.title, 120),
    bio: text(input.bio, 1200),
    image: input.image ? String(input.image) : '',
    email,
    phone: text(input.phone, 40),
    linkedin: text(input.linkedin, 300),
    active: input.active !== false,
    updatedAt: new Date(),
  };
}

export async function listTeam(opts: { activeOnly?: boolean } = {}) {
  return (await findAllOrdered(TEAM_COLLECTION, opts)).map(normalise);
}

export async function getTeamMember(id: string): Promise<TeamRecord | null> {
  const doc = await findById(TEAM_COLLECTION, id);
  return doc ? normalise(doc) : null;
}

export async function createTeamMember(input: TeamInput) {
  const db = await getDb();
  const result = await db.collection(TEAM_COLLECTION).insertOne({
    ...buildSet(input),
    order: await nextOrder(TEAM_COLLECTION),
    createdAt: new Date(),
  });
  return { ok: true, id: String(result.insertedId) };
}

export async function updateTeamMember(id: string, input: TeamInput) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const result = await db
    .collection(TEAM_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: buildSet(input) });
  if (result.matchedCount === 0) throw new Error('Team member not found');
  return { ok: true };
}
