// src/lib/ordered.ts
// SERVER ONLY.
//
// Testimonials and team members are both "a short, hand-ordered list that the
// website renders in order and can hide individual entries from". The ordering,
// visibility and delete behaviour is identical for both, so it lives here once
// and each module keeps only its own field shape.
//
// The ordering rewrite is deliberately whole-list rather than a swap: these
// lists are small, and rewriting them repairs any duplicate or missing `order`
// values instead of preserving them.
import { ObjectId, type Document } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export async function nextOrder(collection: string): Promise<number> {
  const db = await getDb();
  const last = await db.collection(collection).find({}).sort({ order: -1 }).limit(1).toArray();
  return last.length ? Number(last[0].order ?? 0) + 1 : 0;
}

export async function findAllOrdered(
  collection: string,
  opts: { activeOnly?: boolean } = {},
): Promise<Document[]> {
  const db = await getDb();
  const filter = opts.activeOnly ? { active: { $ne: false } } : {};
  return db
    .collection(collection)
    .find(filter)
    .sort({ order: 1, _id: 1 })
    .toArray()
    .catch(() => [] as Document[]);
}

export async function setActive(collection: string, id: string, active: boolean) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db
    .collection(collection)
    .updateOne({ _id: new ObjectId(id) }, { $set: { active, updatedAt: new Date() } });
  return { ok: true };
}

export async function move(collection: string, id: string, direction: 'up' | 'down') {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const coll = db.collection(collection);

  const all = await coll.find({}).sort({ order: 1, _id: 1 }).toArray();
  const index = all.findIndex((doc) => String(doc._id) === id);
  if (index === -1) throw new Error('Not found');

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= all.length) return { ok: true };

  const reordered = [...all];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(target, 0, moved);

  await Promise.all(
    reordered.map((doc, position) => coll.updateOne({ _id: doc._id }, { $set: { order: position } })),
  );
  return { ok: true };
}

export async function removeById(collection: string, id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}

export async function countIn(collection: string): Promise<number> {
  const db = await getDb();
  return db.collection(collection).countDocuments().catch(() => 0);
}

export async function findById(collection: string, id: string): Promise<Document | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection(collection).findOne({ _id: new ObjectId(id) });
}

export const text = (value: unknown, max = 2000) => String(value ?? '').trim().slice(0, max);
