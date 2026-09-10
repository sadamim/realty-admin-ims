// Single source of truth for navigation.
// Every entry maps to a route that exists, and carries the permission needed to
// see it. Unknown roles are granted everything (see src/lib/permissions.ts), so
// existing accounts keep seeing exactly what they saw before.
import type { ReactElement } from 'react';
import {
  IconBuilding,
  IconDashboard,
  IconSkyline,
  IconImage,
  IconInbox,
  IconNews,
  IconSettings,
  IconQuote,
  IconSparkles,
  IconUsers,
  type IconProps,
} from '@/components/icons';
import { can, type Permission } from '@/lib/permissions';

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  icon: (props: IconProps) => ReactElement;
  permission?: Permission;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', hint: 'Live record counts', icon: IconDashboard }],
  },
  {
    label: 'Content',
    items: [
      {
        href: '/microsites',
        label: 'Projects',
        hint: 'Microsites and details',
        icon: IconBuilding,
        permission: 'content.read',
      },
      {
        href: '/blogs',
        label: 'Blogs',
        hint: 'Articles on the public site',
        icon: IconNews,
        permission: 'content.read',
      },
      {
        href: '/banners',
        label: 'Banners',
        hint: 'Homepage hero slides',
        icon: IconImage,
        permission: 'content.read',
      },
      {
        href: '/testimonials',
        label: 'Testimonials',
        hint: 'Client quotes on the homepage',
        icon: IconQuote,
        permission: 'content.read',
      },
      {
        href: '/builders',
        label: 'Builders',
        hint: 'Developers and project counts',
        icon: IconSkyline,
        permission: 'content.read',
      },
      {
        href: '/amenities',
        label: 'Amenities',
        hint: 'Shared amenity library',
        icon: IconSparkles,
        permission: 'content.read',
      },
    ],
  },
  {
    label: 'Engagement',
    items: [
      {
        href: '/enquiries',
        label: 'Enquiries',
        hint: 'Leads from the website',
        icon: IconInbox,
        permission: 'leads.read',
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        href: '/admins',
        label: 'Admin users',
        hint: 'Accounts and roles',
        icon: IconUsers,
        permission: 'users.read',
      },
      {
        href: '/settings',
        label: 'Settings',
        hint: 'Your account and permissions',
        icon: IconSettings,
        permission: 'settings.read',
      },
    ],
  },
];

/** Flat list, in sidebar order. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function visibleGroups(role: unknown): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || can(role, item.permission)),
  })).filter((group) => group.items.length > 0);
}

export function visibleItems(role: unknown): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.permission || can(role, item.permission));
}

export function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Breadcrumb trail for the header, derived from the current path. */
export function crumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  // Longest match wins so /microsites/[id] resolves to Projects, not Dashboard.
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(item.href, pathname));

  if (!match) return [{ label: 'Admin' }];
  if (match.href === '/' || pathname === match.href) return [{ label: match.label }];

  const tail = pathname.slice(match.href.length).replace(/^\//, '');
  const leaf = tail === 'new' ? 'New' : 'Details';
  return [{ label: match.label, href: match.href }, { label: leaf }];
}
