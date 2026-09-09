# Catalogue sections — projects, builders, amenities, testimonials, team

The second pass on top of `CONTENT-SECTIONS.md`. Everything there still holds:
no dependency was added, `package.json` is untouched in both projects, and the
original auth, session and middleware files are unchanged.

What changed, in one line: **every section can now create records, every
section that shows a picture can upload one, and all of it renders on the
public website.**

## New and changed screens

| Route | What it does |
|---|---|
| `/microsites/new` | **New:** create a project. Writes both the `microsite` and `microsite_detail` documents |
| `/microsites/[id]` | The featured image is now a real uploader instead of a filename text box |
| `/builders` | Now has search, status, project counts and an **Edit** action |
| `/builders/new`, `/builders/[id]` | **New:** create, edit and delete a builder, with a logo uploader |
| `/amenities` | Tiles now link to an editor and show how many projects use each amenity |
| `/amenities/new`, `/amenities/[id]` | **New:** create, edit and delete an amenity, with an icon uploader |
| `/testimonials` | **New section:** client quotes, reorder and show/hide inline |
| `/testimonials/new`, `/testimonials/[id]` | Name, role, location, project, quote, 1–5 rating, photo |
| `/team` | **New section:** the people on the website's About page, reorder and show/hide inline |
| `/team/new`, `/team/[id]` | Name, title, bio, photo, email, phone, LinkedIn |

`/media` gained folders for each of these, so an upload is filed under the
section it came from.

## Joining the legacy id scheme

The imported collections still key their relationships off the original MySQL
primary keys, stored as strings — `microsite.micro_id`, `builder.builder_id`,
`amenities.am_id`. A record created here has to join that scheme or nothing will
link to it, so `src/lib/legacy-id.ts` gives it *highest existing number + 1*.

That has three consequences worth knowing:

- **A new project is two documents.** `microsite` holds the name, location and
  tag; `microsite_detail` holds everything else and is joined on `micro_id`.
  The create route writes both, and rolls the first back if the second fails —
  so a project created here never lands in the "no detail row" state the edit
  form has to warn about for imported data.
- **A builder cannot be deleted while projects point at it.** The API answers
  409 with the count, because deleting it would leave those projects with no
  builder name. Hide it instead.
- **Deleting an amenity rewrites the projects that list it.** `am_id` on a
  project is a comma-separated list, so the delete pulls the id out of every
  list rather than leaving a dangling reference behind.

Testimonials and team are new collections (`testimonial`, `team`). Nothing
imported reads or writes them, so adding them cannot disturb the migrated data.

## What the website now reads

| Website | Source |
|---|---|
| `/` featured and trending sliders | `microsite.project_type` — a project created here appears as soon as it is tagged |
| `/` testimonials section | `testimonial`, active only. **Renders nothing at all when empty** |
| `/about` team section | `team`, active only. **Renders nothing at all when empty** |
| `/builders` | `builder` — was a hardcoded array of twelve; falls back to three of them only if the collection is unreachable |
| `/builders/[slug]` | **New route.** Every "View Projects" link on `/builders` was a 404 before this |
| `/projects`, `/projects/[slug]` | Unchanged queries, but every image field now goes through one resolver |

## The image resolver

An image field can hold three things: `/api/media/<id>` (uploaded here), an
absolute URL, or a bare filename left over from the import. Call sites used to
prefix the legacy CDN unconditionally, which turned an uploaded image into
`.../images/fimage//api/media/abc` — a 404.

`src/lib/image-url.ts` (admin) and `src/lib/image-src.ts` (website) each hold one
`resolveImageSrc`, and every image now goes through it: project cards, project
detail sliders and galleries, floor plans, the master plan, amenity icons,
builder logos, blog covers, banners, testimonial and team photos.

Both files are free of any database import, so client components can use them —
which is why they are separate from `media.ts` and `content.ts`.

## Permissions

Unchanged, and unchanged on purpose: an unrecognised role still gets full
access, so no existing account loses anything. The new routes are gated by
`content.read` to see them and `content.write` to save, exactly like blogs and
banners. A read-only role sees every new section with the create and edit
controls simply absent.
