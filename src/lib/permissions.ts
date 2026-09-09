// src/lib/permissions.ts
//
// Role-based permissions. Safe to import from client or server.
//
// IMPORTANT — no lockouts. Before this file existed, every signed-in admin
// could do everything. So an UNRECOGNISED role keeps that behaviour and gets
// full access; the restricted roles below are opt-in. That means adding this
// file cannot lock anyone out of an account that already worked.

export type Permission =
  | 'content.read'   // projects, blogs, banners, amenities, media
  | 'content.write'
  | 'leads.read'
  | 'leads.write'
  | 'users.read'
  | 'users.write'
  | 'settings.read';

export const ALL_PERMISSIONS: Permission[] = [
  'content.read',
  'content.write',
  'leads.read',
  'leads.write',
  'users.read',
  'users.write',
  'settings.read',
];

export interface RoleDefinition {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
}

/** The roles the panel understands. Anything else is treated as full access. */
export const ROLES: RoleDefinition[] = [
  {
    id: 'superadmin',
    label: 'Super admin',
    description: 'Everything, including creating and removing admin accounts.',
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Everything, including creating and removing admin accounts.',
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 'editor',
    label: 'Editor',
    description: 'Full content control and can work enquiries. No account management.',
    permissions: ['content.read', 'content.write', 'leads.read', 'leads.write', 'settings.read'],
  },
  {
    id: 'subadmin',
    label: 'Sub admin',
    description: 'Edits content and reads enquiries. No account management.',
    permissions: ['content.read', 'content.write', 'leads.read', 'settings.read'],
  },
  {
    id: 'viewer',
    label: 'Viewer',
    description: 'Read-only across the panel. Cannot save changes.',
    permissions: ['content.read', 'leads.read', 'settings.read'],
  },
];

export const ASSIGNABLE_ROLES = ROLES.filter((r) => r.id !== 'admin');

const normalise = (role: unknown) => String(role ?? '').trim().toLowerCase();

export function roleDefinition(role: unknown): RoleDefinition | null {
  const key = normalise(role);
  return ROLES.find((r) => r.id === key) ?? null;
}

export function roleLabel(role: unknown): string {
  return roleDefinition(role)?.label ?? String(role ?? 'unknown');
}

/** Permissions for a role. Unknown role => everything (see the note above). */
export function permissionsFor(role: unknown): Permission[] {
  return roleDefinition(role)?.permissions ?? ALL_PERMISSIONS;
}

export function can(role: unknown, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

/** Roles that can manage other accounts — used to block removing the last one. */
export const FULL_ACCESS_ROLE_IDS = ROLES.filter((r) =>
  r.permissions.includes('users.write'),
).map((r) => r.id);
