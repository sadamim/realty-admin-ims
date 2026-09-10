#!/usr/bin/env node
/**
 * Seed five client testimonials into the `testimonial` collection.
 *
 *   npm run seed-testimonials
 *   npm run seed-testimonials -- --replace
 *
 * Idempotent: a testimonial is matched on the person's name, so re-running
 * updates the five rather than creating duplicates. Existing testimonials you
 * wrote yourself are never touched. Pass --replace to overwrite the text of the
 * five seeded ones if you have since edited them.
 *
 * These are placeholder testimonials written for this seed, not real customer
 * quotes. Edit or replace them in the admin panel before the site goes live —
 * publishing invented quotes as if they were real is not something you want on
 * a property site.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MongoClient } from 'mongodb';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// --- .env.local (no dotenv dependency) --------------------------------------
function loadEnv(file) {
  try {
    for (const raw of readFileSync(join(ROOT, file), 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* file is optional */
  }
}
loadEnv('.env.local');
loadEnv('.env');

const replace = process.argv.includes('--replace');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'realtyfocus';

if (!uri) {
  console.error('\n  MONGODB_URI is not set. Create .env.local first — see .env.example.\n');
  process.exit(1);
}

const TESTIMONIALS = [
  {
    name: 'Anita Rao',
    role: 'Home buyer',
    location: 'Whitefield, Bangalore',
    project: 'Prestige Lakeside Habitat',
    rating: 5,
    quote:
      'We had shortlisted four projects and were going in circles. The team walked us through the RERA status and the builder’s delivery record for each one, and the shortlist became obvious. We moved in eight months later.',
  },
  {
    name: 'Vikram Shetty',
    role: 'NRI investor',
    location: 'Dubai',
    project: 'Brigade Cornerstone Utopia',
    rating: 5,
    quote:
      'Buying from another country usually means trusting photographs. They did the site visit on video, sent the approval documents unprompted, and handled the registration paperwork while I was abroad.',
  },
  {
    name: 'Meera Krishnan',
    role: 'First-time buyer',
    location: 'Sarjapur Road, Bangalore',
    project: 'Sobha Neopolis',
    rating: 5,
    quote:
      'I did not know what to ask. They explained the difference between carpet and super built-up area before I signed anything, and told me plainly when a project was outside my budget rather than pushing it.',
  },
  {
    name: 'Rahul Menon',
    role: 'Seller',
    location: 'Hebbal, Bangalore',
    project: '',
    rating: 4,
    quote:
      'My apartment had been listed for five months with no serious offers. They repriced it against actual closed deals in the same tower, not asking prices, and it sold in six weeks.',
  },
  {
    name: 'Sunitha and Arun Prakash',
    role: 'Home buyers',
    location: 'Electronic City, Bangalore',
    project: 'Godrej Splendour',
    rating: 5,
    quote:
      'What we appreciated most was that nobody chased us. We were given the comparison, given time, and the advisor picked up the phone every time we had a question about the loan.',
  },
];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

try {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('testimonial');

  // New entries go after anything already there, in the order listed above.
  const last = await collection.find({}).sort({ order: -1 }).limit(1).toArray();
  let order = last.length ? Number(last[0].order ?? 0) + 1 : 0;

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const person of TESTIMONIALS) {
    const existing = await collection.findOne({ name: person.name });

    if (existing && !replace) {
      skipped += 1;
      continue;
    }

    const doc = {
      ...person,
      image: '',
      active: true,
      updatedAt: new Date(),
    };

    if (existing) {
      await collection.updateOne({ _id: existing._id }, { $set: doc });
      updated += 1;
    } else {
      await collection.insertOne({ ...doc, order: order++, createdAt: new Date() });
      created += 1;
    }
  }

  console.log(`\n  Testimonials: ${created} created, ${updated} updated, ${skipped} left alone.`);
  console.log('  They are live on the homepage. Add photos in the admin panel at /testimonials.');
  console.log('  These are placeholder quotes — replace them with real ones before launch.\n');
} catch (error) {
  console.error('\n  Failed:', error.message, '\n');
  process.exitCode = 1;
} finally {
  await client.close();
}
