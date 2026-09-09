// src/lib/overview.ts
// SERVER ONLY.
// Counts for the sections added after the original build. getCounts() in
// admin-data.ts is left exactly as it was; this sits alongside it.
import { countBanners } from '@/lib/banners';
import { countMedia } from '@/lib/media';
import { countNewLeads } from '@/lib/leads';
import { countIn } from '@/lib/ordered';
import { TESTIMONIAL_COLLECTION } from '@/lib/testimonials';
import { TEAM_COLLECTION } from '@/lib/team';

export interface ExtraCounts {
  banners: number;
  media: number;
  newLeads: number;
  testimonials: number;
  team: number;
}

export async function getExtraCounts(): Promise<ExtraCounts> {
  const [banners, media, newLeads, testimonials, team] = await Promise.all([
    countBanners(),
    countMedia(),
    countNewLeads(),
    countIn(TESTIMONIAL_COLLECTION),
    countIn(TEAM_COLLECTION),
  ]);
  return { banners, media, newLeads, testimonials, team };
}
