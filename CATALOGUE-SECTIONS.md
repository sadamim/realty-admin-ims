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

The Team and Media sections were removed in a later pass — see the bottom of
this file.

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


---

# Third pass — brand, banners, SEO, charts

## Brand

The navy and red are now sampled from the live site: the logo wordmark and
headings there are `rgb(9,5,69)` (#090545) and the Submit button is
`rgb(192,15,27)` (#C00F1B). Both apps already referenced colour *tokens*
everywhere rather than hard-coded hexes, so re-branding was a change to the
token values in `tailwind.config.ts` (plus the CSS variables in the website's
`globals.css`) and nothing else. Shadows were re-tinted to the new navy so they
sit on the same hue.

If you want the square button corners the live site uses, that is one value —
`--radius` in the website's `globals.css`. It is deliberately left rounded here,
because squaring it also squares every card.

## Builder logos were 404ing

`builder.logo` holds a bare filename, and the code resolved it against
`realtyfocus.info/images/logo/`. That path does not exist. Probing the live CDN:

    /images/builder/Builders1.jpg   -> 200, 250x150
    /images/logo/Builders1.jpg      -> 404
    /public/images/builder/…        -> 404  (the live site's own <img> tags are broken)

So the folder is `builder`. Fixed in `image-url.ts`, `builders.ts` and the
website's `content.ts`.

## Banners: three crops per slide

A slide now carries `image` (desktop, required), `imageTablet` and `imageMobile`
(both optional). The hero renders a `<picture>` with the narrowest source first,
so a phone downloads the tall crop rather than a 2000px-wide desktop image that
crops its subject out. An empty slot falls back to the desktop image *in the
data layer*, so the component needs no null handling and banners saved before
this change behave exactly as they did.

## Search engines

`src/lib/seo.ts` on the website builds every page's title, description,
canonical URL and social cards. The root layout sets `metadataBase` and a
`%s | Realty Focus` title template, so a page supplies only its own title.

Seven routes previously had no metadata at all and inherited the site-wide title
— including the homepage and every one of the 2,000+ project pages, which meant
they were all identical to a crawler. They now have their own.

Editors can override the derived text: `metaTitle` / `metaDescription` on blogs
and builders, `meta_title` / `meta_description` on a project's detail row. Empty
is the right default — the page describes itself from its own content. The admin
shows a live search preview and a character counter, because there is no other
way to see that a 78-character title will be cut off.

## Project highlights

`microsite_detail.highlights` — one selling point per line — renders as a
feature grid on the project page. Empty means the section is skipped.

## Dashboard charts

Two, both server-rendered inline SVG, no charting dependency:

- **Enquiries per month**, last 12 months, from `leads`. Months with none are
  plotted as zero rather than left as gaps, and rows whose date will not parse
  are dropped rather than bucketed into the wrong month.
- **Busiest builders**, projects per developer.

Both are single-series, so there is no legend to misread and no categorical
palette to get wrong; one hue carries magnitude, and every bar is the same
colour — colour never encodes rank, which would change as soon as the data does.
Each chart has a "View as table" disclosure so the numbers are readable without
seeing colour at all.

## Removed

Team and Media are gone: routes, components, `lib/team.ts`, the API routes, the
nav entries and the dashboard tiles.

Uploading still works everywhere — `POST /api/media` and `GET /api/media/[id]`
are untouched, and `DELETE /api/media/[id]` still works by id. What you lose is
the browsable library screen. `saveMedia`, `getMediaBytes` and `deleteMedia`
stayed; `listMedia`, `countMedia` and the usage-lookup helpers went with the
screen that used them.

## Testimonials

`npm run seed-testimonials` inserts five. It matches on name, so re-running
updates rather than duplicating; `--replace` overwrites text you have since
edited. **They are placeholder quotes, not real customers** — replace them in
the admin panel before launch.
