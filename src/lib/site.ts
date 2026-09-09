/**
 * Where the public website lives. Used only to build "view on the website"
 * links out of the panel. Override with NEXT_PUBLIC_SITE_URL in Vercel if the
 * domain changes.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://realty-ims.vercel.app'
).replace(/\/$/, '');
