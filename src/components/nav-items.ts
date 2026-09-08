// Single source of truth for navigation.
// These are exactly the routes that exist today — nothing here is aspirational.
import type { ReactElement } from 'react';
import {
  IconBuilding,
  IconDashboard,
  IconHardHat,
  IconSparkles,
  IconUsers,
  type IconProps,
} from '@/components/icons';

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: (props: IconProps) => ReactElement;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', hint: 'Live record counts', icon: IconDashboard },
  { href: '/microsites', label: 'Projects', hint: 'Microsites and details', icon: IconBuilding },
  { href: '/builders', label: 'Builders', hint: 'Developers and project counts', icon: IconHardHat },
  { href: '/amenities', label: 'Amenities', hint: 'Shared amenity library', icon: IconSparkles },
  { href: '/admins', label: 'Admin users', hint: 'Panel accounts', icon: IconUsers },
];

export function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Breadcrumb trail for the header, derived from the current path. */
export function crumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  const match = NAV_ITEMS.find((item) => isActive(item.href, pathname));
  if (!match) return [{ label: 'Admin' }];
  if (match.href === '/' || pathname === match.href) return [{ label: match.label }];
  return [{ label: match.label, href: match.href }, { label: 'Details' }];
}
