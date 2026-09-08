# Realty Focus — Admin (Next.js)

A new admin panel that reads and writes MongoDB directly. Replaces the CRA app
in `realtyfocus-admin`, which talked to the Express API and compared passwords
in plain text.

## Setup

```bash
npm install
cp .env.example .env.local        # then fill it in
npm run create-admin              # prints your credentials once
npm run dev                       # http://localhost:3002
```

`.env.local` needs three values:

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Same Atlas cluster as the public site |
| `MONGODB_DB` | `realtyfocus` |
| `SESSION_SECRET` | 32+ chars. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

Runs on port **3002** so it can sit alongside the public site (3000) and the
Express API (4000).

## Authentication

- Passwords are bcrypt-hashed (cost 12). Login compares with `bcrypt.compare`.
- **Legacy rows upgrade themselves.** The imported `admin` documents store
  plaintext passwords. The first successful login with one of those replaces it
  with a hash, so old accounts keep working and stop being plaintext.
- The session is a JWT in an httpOnly, sameSite=lax cookie, valid 8 hours.
- `middleware.ts` gates every route except `/login`. It verifies with `jose`
  because middleware runs on the Edge runtime, where bcrypt and Node crypto are
  unavailable; bcrypt only ever runs inside Node-runtime route handlers.
- Login failures return one message for both "no such user" and "wrong
  password" — distinguishing them would let anyone enumerate admin emails.

Add or reset an account at any time:

```bash
npm run create-admin -- --email someone@example.com --role subadmin
npm run create-admin -- --email admin@realtyfocus.info      # resets password
```

## Pages

| Route | What it does |
|---|---|
| `/` | Live record counts |
| `/microsites` | Search, filter by tag, paginate |
| `/microsites/[id]` | Edit project + detail; view prices, floor plans, amenities |
| `/builders` | Search, paginate, project counts per builder |
| `/amenities` | All amenities with icons |
| `/admins` | Accounts (never selects the password field) |

## The data model — read before adding queries

Collections were imported verbatim from MySQL. Documents have a new `ObjectId`
in `_id`, but **relationships still run through the original MySQL primary keys,
stored as strings**:

| Collection | Legacy PK | Foreign keys |
|---|---|---|
| `microsite` | `micro_id` | — |
| `microsite_detail` | `md_id` | `micro_id`, `builder_id`, `type_id`, `status_id` |
| `price` | `id` | `micro_id` |
| `floor_plan` | `id_floor` | `micro_id` |
| `builder` | `builder_id` | — |
| `prop_status` | `status_id` | — |
| `prop_type` | `type_id` | — |

Three rules that follow from this:

1. **Join on the legacy string fields, never `_id`.**
2. **Use the singular, snake_case collections.** `microsite`, not `microsites`.
   Both exist; the pluralised ones are empty shells Mongoose created.
3. **Use `$arrayElemAt: [..., 0]`, not `$unwind`.** A handful of microsites have
   more than one `microsite_detail` row, and unwinding duplicates them.

Numeric columns (`sqft`, `basic_cost`, `latitude`) are strings and need
converting before comparison. `am_id` / `bank_id` / `legal_id` are
comma-separated id lists. `gallery_image` / `slider_image` hold
`image_data.img_id` values, not filenames.

## Not built yet

Blogs, leads, meta tags, access control, and image upload. The old CRA panel
still covers those — keep it running until they're ported.
