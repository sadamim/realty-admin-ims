// src/lib/admins.ts
// SERVER ONLY.
//
// Account management. Reads still go through listAdmins() in admin-data.ts —
// this file only adds the writes, and every one of them is guarded so the panel
// cannot be locked out of itself.
import { ObjectId, type Document } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';
import { can } from '@/lib/permissions';

export const ADMIN_COLLECTION = 'admin';
export const MIN_PASSWORD_LENGTH = 8;

export interface AdminInput {
  email?: string;
  username?: string;
  role?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  status?: '0' | '1';
}

const clean = (value: unknown) => String(value ?? '').trim();

function assertPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

/** Accounts that are enabled AND allowed to manage other accounts. */
export async function countFullAccessAdmins(excludeId?: string): Promise<number> {
  const db = await getDb();
  const docs = await db
    .collection(ADMIN_COLLECTION)
    .find({}, { projection: { role: 1, status: 1 } })
    .toArray();

  return docs.filter((doc) => {
    if (excludeId && String(doc._id) === excludeId) return false;
    if (String(doc.status ?? '1') === '0') return false;
    return can(doc.role, 'users.write');
  }).length;
}

async function getAdminDoc(id: string): Promise<Document> {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const doc = await db.collection(ADMIN_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error('Account not found');
  return doc;
}

export async function createAdmin(input: AdminInput) {
  const email = clean(input.email).toLowerCase();
  const password = String(input.password ?? '');

  if (!email || !email.includes('@')) throw new Error('A valid email address is required.');
  assertPassword(password);

  const db = await getDb();
  const existing = await db
    .collection(ADMIN_COLLECTION)
    .findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (existing) throw new Error('An account with that email already exists.');

  const result = await db.collection(ADMIN_COLLECTION).insertOne({
    username: clean(input.username) || email.split('@')[0],
    email,
    password: await hashPassword(password),
    role: clean(input.role) || 'subadmin',
    status: input.status === '0' ? '0' : '1',
    f_name: clean(input.firstName),
    l_name: clean(input.lastName),
    image: '',
    thumb_img: '',
    date: new Date(),
  });

  return { ok: true, id: String(result.insertedId) };
}

/**
 * Update username / role / status. `actingUserId` is the signed-in admin, used
 * to block the two ways someone could lock themselves (or everyone) out.
 */
export async function updateAdmin(id: string, input: AdminInput, actingUserId: string) {
  const doc = await getAdminDoc(id);
  const isSelf = String(doc._id) === actingUserId;

  const set: Record<string, unknown> = { updatedAt: new Date() };

  if (input.username !== undefined) set.username = clean(input.username) || doc.username;
  if (input.firstName !== undefined) set.f_name = clean(input.firstName);
  if (input.lastName !== undefined) set.l_name = clean(input.lastName);

  if (input.role !== undefined && clean(input.role) !== String(doc.role ?? '')) {
    if (isSelf) throw new Error('You cannot change your own role.');
    const nextRole = clean(input.role);
    if (can(doc.role, 'users.write') && !can(nextRole, 'users.write')) {
      if ((await countFullAccessAdmins(id)) === 0) {
        throw new Error('This is the last account that can manage users — change another one first.');
      }
    }
    set.role = nextRole;
  }

  if (input.status !== undefined && input.status !== String(doc.status ?? '1')) {
    if (isSelf) throw new Error('You cannot disable your own account.');
    if (input.status === '0' && can(doc.role, 'users.write')) {
      if ((await countFullAccessAdmins(id)) === 0) {
        throw new Error('This is the last account that can manage users — it cannot be disabled.');
      }
    }
    set.status = input.status === '0' ? '0' : '1';
  }

  const db = await getDb();
  await db.collection(ADMIN_COLLECTION).updateOne({ _id: doc._id }, { $set: set });
  return { ok: true };
}

export async function resetAdminPassword(id: string, password: string) {
  const doc = await getAdminDoc(id);
  assertPassword(password);

  const db = await getDb();
  await db
    .collection(ADMIN_COLLECTION)
    .updateOne({ _id: doc._id }, { $set: { password: await hashPassword(password), updatedAt: new Date() } });
  return { ok: true };
}

export async function deleteAdmin(id: string, actingUserId: string) {
  const doc = await getAdminDoc(id);
  if (String(doc._id) === actingUserId) throw new Error('You cannot delete your own account.');

  if (can(doc.role, 'users.write') && (await countFullAccessAdmins(id)) === 0) {
    throw new Error('This is the last account that can manage users — it cannot be deleted.');
  }

  const db = await getDb();
  await db.collection(ADMIN_COLLECTION).deleteOne({ _id: doc._id });
  return { ok: true };
}
