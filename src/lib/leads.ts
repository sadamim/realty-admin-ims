// src/lib/leads.ts
// SERVER ONLY.
//
// Enquiries. The `leads` collection is legacy and its column names vary, so
// reads map every alias onto a canonical shape. The only field this panel ever
// writes is `handled` (plus who marked it and when) — an additive flag that
// leaves the imported columns exactly as they are.
import { ObjectId, type Document, type Filter } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export const LEADS_COLLECTION = 'leads';

export interface LeadRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  project: string;
  source: string;
  handled: boolean;
  handledBy: string;
  createdAt: string | null;
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

export function normaliseLead(doc: Document): LeadRecord {
  const created =
    doc.createdAt ?? doc.created_at ?? doc.date ?? doc.enquiry_date ?? doc.added_on ?? null;
  const parsed = created ? new Date(created as string) : null;

  return {
    _id: String(doc._id),
    name: first(doc.name, doc.full_name, doc.customer_name, doc.username, doc.fname, 'Unnamed'),
    email: first(doc.email, doc.email_id, doc.emailid),
    phone: first(doc.phone, doc.mobile, doc.contact, doc.phone_no, doc.mobile_no),
    message: first(doc.message, doc.msg, doc.comments, doc.enquiry, doc.description, doc.query),
    project: first(doc.project, doc.project_name, doc.property, doc.micro_id, doc.microsite),
    source: first(doc.source, doc.page, doc.form, doc.type),
    handled: doc.handled === true,
    handledBy: first(doc.handledBy),
    createdAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null,
  };
}

export async function listLeads(opts: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}) {
  const db = await getDb();
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 20));

  const filter: Filter<Document> = {};
  const and: Filter<Document>[] = [];

  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegex(opts.search.trim()), 'i');
    and.push({
      $or: [
        { name: rx }, { full_name: rx }, { customer_name: rx },
        { email: rx }, { email_id: rx },
        { phone: rx }, { mobile: rx },
        { message: rx }, { msg: rx },
        { project: rx }, { project_name: rx },
      ],
    });
  }
  if (opts.status === 'handled') and.push({ handled: true });
  if (opts.status === 'new') and.push({ handled: { $ne: true } });
  if (and.length) filter.$and = and;

  const collection = db.collection(LEADS_COLLECTION);
  const total = await collection.countDocuments(filter).catch(() => 0);
  const docs = await collection
    .find(filter)
    .sort({ _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray()
    .catch(() => [] as Document[]);

  return {
    items: docs.map(normaliseLead),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function countNewLeads(): Promise<number> {
  const db = await getDb();
  return db
    .collection(LEADS_COLLECTION)
    .countDocuments({ handled: { $ne: true } })
    .catch(() => 0);
}

export async function setLeadHandled(id: string, handled: boolean, by: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id');
  const db = await getDb();
  const result = await db.collection(LEADS_COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: { handled, handledBy: handled ? by : '', handledAt: handled ? new Date() : null } },
  );
  if (result.matchedCount === 0) throw new Error('Enquiry not found');
  return { ok: true };
}
