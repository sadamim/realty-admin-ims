// src/lib/image-url.ts
//
// Pure image-path helpers. No database import, so this file is safe to pull
// into a client component — which is why it is separate from src/lib/media.ts.
//
// Three kinds of value can end up in an image field:
//
//   "/api/media/<id>"          uploaded through this panel, served by both apps
//   "https://…/photo.jpg"      an absolute URL (the legacy CDN, or anywhere)
//   "photo.jpg"                a bare filename left over from the MySQL import,
//                              which lives under realtyfocus.info/images/<folder>/
//
// resolveImageSrc turns any of them into something an <img> can load.

export const LEGACY_IMAGE_BASE = 'https://realtyfocus.info/images';

/** The path stored on a document and rendered by both apps. */
export const mediaUrl = (id: string | { toString(): string }) => `/api/media/${String(id)}`;

/** True for a value this panel uploaded (as opposed to a legacy filename). */
export const isUploadedMedia = (src: unknown) =>
  String(src ?? '').trim().startsWith('/api/media/');

export function resolveImageSrc(src: unknown, legacyFolder = 'fimage'): string | null {
  const value = String(src ?? '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return value;
  return `${LEGACY_IMAGE_BASE}/${legacyFolder}/${value}`;
}

export type MediaFolder =
  | 'blog'
  | 'banner'
  | 'project'
  | 'builder'
  | 'amenity'
  | 'testimonial'
  | 'team'
  | 'general';

export const MEDIA_FOLDERS: MediaFolder[] = [
  'blog',
  'banner',
  'project',
  'builder',
  'amenity',
  'testimonial',
  'team',
  'general',
];

/** Human labels for the media filter chips. */
export const MEDIA_FOLDER_LABELS: Record<MediaFolder, string> = {
  blog: 'Blogs',
  banner: 'Banners',
  project: 'Projects',
  builder: 'Builders',
  amenity: 'Amenities',
  testimonial: 'Testimonials',
  team: 'Team',
  general: 'General',
};

/**
 * Where a bare legacy filename lives on the old CDN, per section. Used when a
 * field still holds an imported filename rather than an uploaded /api/media id.
 */
export const LEGACY_FOLDER_FOR: Record<MediaFolder, string> = {
  blog: 'blog',
  banner: 'banner',
  project: 'fimage',
  builder: 'logo',
  amenity: 'amenities',
  testimonial: 'testimonial',
  team: 'team',
  general: 'fimage',
};
