// src/lib/legacy-id.ts
// SERVER ONLY.
//
// The imported collections still key their relationships off the ORIGINAL MySQL
// primary keys, stored as strings (builder.builder_id, amenities.am_id,
// microsite.micro_id). A row created in this panel has to join that scheme or
// nothing will link to it, so a new record gets "highest existing number + 1".
//
// $toDouble with onError skips the handful of rows whose legacy id is not a
// clean number, rather than throwing the whole aggregation away.
import type { Db } from 'mongodb';

export async function nextLegacyId(db: Db, collection: string, field: string): Promise<string> {
  const [top] = await db
    .collection(collection)
    .aggregate([
      { $addFields: { __n: { $convert: { input: `$${field}`, to: 'double', onError: 0, onNull: 0 } } } },
      { $sort: { __n: -1 } },
      { $limit: 1 },
      { $project: { __n: 1 } },
    ])
    .toArray();

  const highest = Number(top?.__n ?? 0);
  return String((Number.isFinite(highest) ? Math.floor(highest) : 0) + 1);
}

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

/** "Bangalore, Chennai" <-> ["Bangalore","Chennai"] — the CSV shape the import used. */
export const csvToList = (value: unknown): string[] =>
  String(value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

export const listToCsv = (value: unknown): string =>
  Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean).join(', ') : String(value ?? '').trim();
