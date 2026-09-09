# Admin panel redesign

A UI-only redesign. Nothing in the data layer, authentication, API routes or
database access changed — those files are byte-identical to before.

## What was NOT touched

```
src/lib/admin-data.ts      src/app/api/auth/login/route.ts
src/lib/auth.ts            src/app/api/auth/logout/route.ts
src/lib/mongodb.ts         src/app/api/microsites/[id]/route.ts
src/lib/session.ts         middleware.ts
scripts/create-admin.mjs   package.json   .env.local
```

Same routes, same query params (`page`, `q`, `type`), same page size (20), same
`PUT /api/microsites/:id` payload, same JWT cookie session, same bcrypt login
with legacy-plaintext upgrade.

## Dependencies

None added. There is no icon library, no animation library and no component
library — every icon is inline SVG in `src/components/icons.tsx` and every
animation is a Tailwind keyframe or CSS transition. `package.json` is unchanged.

## Design system

| Layer | Where |
|---|---|
| Tokens — colours, type, radii, shadows, easing, keyframes | `tailwind.config.ts` |
| Component classes — `.card` `.btn-*` `.input*` `.badge-*` `.chip*` `.th` `.td` `.row` `.skeleton` | `src/app/globals.css` |
| Icons | `src/components/icons.tsx` |
| Primitives | `src/components/ui/` — Toast, Modal, ConfirmDialog, CountUp, Skeleton, EmptyState, Spinner |

Brand colours are unchanged (`navy #1b2a41`, `ink #0f1721`, `brand #c8102e`);
they were only extended into full scales.

## Layout

`AppShell` → `Sidebar` + `Topbar` + animated `main`.

- Sidebar collapses to icons only (76px), preference stored in `localStorage`,
  tooltips appear on hover when collapsed.
- Below `lg` it becomes a drawer with a scrim, body-scroll lock and a slide
  animation; it closes automatically on navigation.
- Header: breadcrumbs, global project search, notifications, profile menu.
- Auth still runs in the server layout (`(dashboard)/layout.tsx`) before any of
  this renders.

## Notifications

`ToastProvider` (root layout) does two jobs: transient toasts, and the last 20
of them as the feed behind the header bell. The feed only ever contains real
events from the current session — saves, validation warnings, API errors,
session expiry. Nothing is fabricated.

## Navigation items

The sidebar lists the five routes that actually exist: Dashboard, Projects,
Builders, Amenities, Admin users. Enquiries (`leads`) and Articles (`blog`)
appear as dashboard statistics because those collections are counted by
`getCounts()`, but they have no pages yet, so no menu entries were invented for
them.

## Behaviour changes (deliberate, additive)

1. Searching on `/microsites` now preserves the active tag filter — previously
   submitting the search box dropped `?type=`.
2. Signing out asks for confirmation. The mechanism is the same POST.
3. `/admins` and `/amenities` gained client-side search (and sorting on
   `/admins`) over rows the server already sent. No new API, no new query
   params, no schema change.
4. Route-level `loading.tsx` skeletons, an error boundary and not-found pages.

## Accessibility

`prefers-reduced-motion` disables all animation globally; focus-visible rings
throughout; `aria-current`, `aria-expanded`, `aria-live` on the toast region;
Escape and click-outside close every overlay; focus returns to the trigger when
a modal closes.

## Build

```bash
npm install
npm run build
npm run dev     # http://localhost:3002
```
