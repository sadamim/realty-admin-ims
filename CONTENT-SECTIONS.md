# Content sections — blogs, banners, media, enquiries, permissions

Added on top of the redesign. As before, the original data, auth and API files
are untouched: `src/lib/admin-data.ts`, `auth.ts`, `mongodb.ts`, `session.ts`,
`middleware.ts`, the three original API routes, `scripts/create-admin.mjs` and
`package.json`.

**No dependencies were added.** Nothing in `package.json` changed.

## Where images live

Both apps deploy to Vercel, where the filesystem is read-only — nothing can be
written into `public/`. So uploads go into a `media` collection in the Atlas
database the two apps already share, and each app serves the bytes from its own
`/api/media/[id]` route with `Cache-Control: immutable`, so Vercel's CDN caches
them after the first hit.

An image is stored on a blog or banner as the relative path `/api/media/<id>`,
which resolves correctly in whichever app renders it. Absolute URLs (the legacy
`realtyfocus.info` CDN, Google Storage) still work and pass through untouched.

Before upload the browser downscales to max 1920px at quality 0.85 — no
server-side image library, no extra dependency. GIF and AVIF are left alone so
animation survives. The server caps uploads at 4 MB and accepts JPEG, PNG,
WebP, GIF and AVIF only.

The admin's `/api/media/[id]` stays behind the session cookie (middleware is
unchanged — the browser sends the cookie with `<img>` requests). The public
site has its own copy of the route for anonymous visitors.

## New sections

| Route | What it does |
|---|---|
| `/blogs` | List, search, filter by status and category, paginate |
| `/blogs/new`, `/blogs/[id]` | Create and edit: title, auto slug, excerpt, body, cover image, category, author, publish date, draft/published. Delete with confirmation |
| `/banners` | Hero slides: reorder, show/hide, delete inline |
| `/banners/new`, `/banners/[id]` | Image, headline, supporting line, button label and link, with a live preview of the hero |
| `/enquiries` | The `leads` collection: search, filter new/handled, detail dialog, mark handled |
| `/media` | Every uploaded image, filtered by folder, with usage shown before deletion |
| `/settings` | Your account, change your own password, and the role/permission matrix |
| `/admins` | Now also creates, edits, disables, deletes accounts and resets passwords |

## Legacy data tolerance

`blog` and `leads` were imported from MySQL, so their column names vary. Reads
map every known alias onto one canonical shape (`title`/`blog_title`/`heading`,
`body`/`content`/`blog_content`, `image`/`blog_image`/`featured_image`,
`name`/`full_name`/`customer_name`, and so on). Writes only ever `$set` the
canonical fields, so any other legacy column on a document is left alone.

Hidden posts: rows written here use `status: "draft"`; imported rows used
`status: "0"`. Both count as hidden, and the admin and the public site apply the
same rule. A row with no status at all is treated as published, because that is
what it was on the old site.

Imported posts have no `slug` column, so the website derives one from the title
and can resolve it back — saving a post from this panel writes a real slug.

The only field the panel ever writes to a lead is `handled` (plus who and when).

## Permissions

`src/lib/permissions.ts` defines Super admin, Editor, Sub admin and Viewer.

**A role the panel does not recognise gets full access.** Before this existed,
every signed-in admin could do everything, so unknown roles keep that behaviour
and the restricted roles are opt-in. Adding this cannot lock anyone out of an
account that already worked.

Guards against lockout: you cannot change your own role, disable or delete your
own account, and the last enabled account that can manage users cannot be
demoted, disabled or deleted.

Every new API route re-checks the permission on the server — the UI gating is
convenience, not the control.

## Changes on the public website

In `realtyfocus12`:

- `src/lib/content.ts` — reads blogs and banners from the same database.
- `src/lib/richtext.ts` — renders post bodies. Markdown-lite text is HTML-escaped
  before any tag is added; legacy rows that already contain HTML render as HTML.
- `src/app/api/media/[id]/route.ts` — serves uploaded images to visitors.
- `src/app/blogs/page.tsx` — was a hardcoded array of nine posts; now reads the
  database, with real category filtering and pagination.
- `src/app/blogs/[slug]/page.tsx` — **new**. This route never existed, so every
  "Read more" link on the old blogs page led to a 404.
- `src/components/home/HeroSection.tsx` — takes an optional `slides` prop. With
  no banners configured it renders exactly as before, from its built-in image
  and copy.
- Three pre-existing TypeScript errors were fixed there — see that project's
  `ADMIN-CONTENT.md`.

## Build

```bash
npm install
npm run build
npm run dev     # http://localhost:3002
```
