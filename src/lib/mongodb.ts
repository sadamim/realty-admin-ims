// src/lib/mongodb.ts
// SERVER ONLY. Cached MongoClient shared across the Next server process and
// stashed on globalThis so Fast Refresh doesn't open a new pool on every edit.
import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'realtyfocus';

if (!uri) {
  throw new Error('MONGODB_URI is not set. Add it to .env.local — see .env.example.');
}

type Cache = { client: MongoClient | null; promise: Promise<MongoClient> | null };
const g = globalThis as unknown as { _rfAdminMongo?: Cache };
const cache: Cache = g._rfAdminMongo ?? (g._rfAdminMongo = { client: null, promise: null });

export async function getClient(): Promise<MongoClient> {
  if (cache.client) return cache.client;
  if (!cache.promise) {
    cache.promise = new MongoClient(uri as string, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    }).connect();
  }
  cache.client = await cache.promise;
  return cache.client;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db(dbName);
}

/** ObjectId/Date are not serialisable across the server/client boundary. */
export const serialize = <T>(doc: T): T => JSON.parse(JSON.stringify(doc));
