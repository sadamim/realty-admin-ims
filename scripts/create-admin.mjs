#!/usr/bin/env node
/**
 * Create (or reset) an administrator account in the `admin` collection.
 *
 *   npm run create-admin
 *   npm run create-admin -- --email you@example.com --username you --role superadmin
 *   npm run create-admin -- --email you@example.com --password "your own password"
 *
 * The password is HASHED with bcrypt before it is stored. If you don't supply
 * one, a strong random password is generated here on your machine and printed
 * once — it is never written to disk and never leaves this computer.
 *
 * Re-running for an existing email resets that account's password rather than
 * creating a duplicate.
 */
import { readFileSync } from 'node:fs';
import { randomBytes, randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// --- .env.local (no dotenv dependency) -------------------------------------
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

// --- args -------------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const email = arg('email', 'admin@realtyfocus.info').trim().toLowerCase();
const username = arg('username', email.split('@')[0]);
const role = arg('role', 'superadmin');
const firstName = arg('first', '');
const lastName = arg('last', '');

// Ambiguous characters (O/0, l/1/I) left out so it can be read aloud or retyped.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_@#%+=';
function generatePassword(length = 24) {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

const suppliedPassword = arg('password', null);
const password = suppliedPassword ?? generatePassword();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'realtyfocus';

if (!uri) {
  console.error('\n  MONGODB_URI is not set. Create .env.local first — see .env.example.\n');
  process.exit(1);
}

// --- do it ------------------------------------------------------------------
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });

try {
  await client.connect();
  const admins = client.db(dbName).collection('admin');

  await admins.createIndex({ email: 1 }, { unique: true }).catch(() => {
    console.warn('  ! Could not create a unique index on email (duplicates may already exist).');
  });

  const hash = await bcrypt.hash(password, 12);
  const existing = await admins.findOne({ email });

  if (existing) {
    await admins.updateOne(
      { _id: existing._id },
      { $set: { password: hash, role, status: '1', username, updatedAt: new Date() } }
    );
  } else {
    await admins.insertOne({
      username,
      email,
      password: hash,
      role,
      status: '1',
      f_name: firstName,
      l_name: lastName,
      image: '',
      thumb_img: '',
      date: new Date(),
    });
  }

  const width = 68;
  const line = (s = '') => console.log('  │ ' + s.padEnd(width) + '│');

  console.log('\n  ┌' + '─'.repeat(width + 1) + '┐');
  line(existing ? ' PASSWORD RESET' : ' ADMIN ACCOUNT CREATED');
  line();
  line(`   Sign in at   http://localhost:3002/login`);
  line(`   Email        ${email}`);
  line(`   Password     ${password}`);
  line(`   Role         ${role}`);
  line();
  line('   Shown once. Save it in a password manager now.');
  if (!suppliedPassword) line('   Generated locally — it was never sent anywhere.');
  console.log('  └' + '─'.repeat(width + 1) + '┘\n');
} catch (error) {
  console.error('\n  Failed:', error.message, '\n');
  process.exitCode = 1;
} finally {
  await client.close();
}
