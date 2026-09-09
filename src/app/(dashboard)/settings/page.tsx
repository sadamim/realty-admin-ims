import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { ALL_PERMISSIONS, ROLES, can, permissionsFor, roleLabel } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import ChangePassword from './ChangePassword';
import { SITE_URL } from '@/lib/site';
import { IconCheck, IconClose, IconExternal, IconShield } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings — Realty Focus Admin' };

const PERMISSION_LABELS: Record<string, string> = {
  'content.read': 'View content',
  'content.write': 'Edit content',
  'leads.read': 'View enquiries',
  'leads.write': 'Work enquiries',
  'users.read': 'View accounts',
  'users.write': 'Manage accounts',
  'settings.read': 'View settings',
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const mine = permissionsFor(user.role);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Your account, and what each role is allowed to do."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="section-title">Your account</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Username</dt>
                <dd className="truncate font-medium text-slate-900">{user.username || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="truncate font-medium text-slate-900">{user.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Role</dt>
                <dd>
                  <span className="badge-info">{roleLabel(user.role)}</span>
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
              {mine.map((permission) => (
                <span key={permission} className="badge-neutral">
                  {PERMISSION_LABELS[permission] ?? permission}
                </span>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="section-title">Change your password</h2>
            <p className="muted mt-0.5">
              Hashed with bcrypt before it is stored. Your session stays signed in.
            </p>
            <ChangePassword userId={user.id} />
          </section>

          <section className="card p-5">
            <h2 className="section-title">Public website</h2>
            <p className="muted mt-0.5">
              Where the content edited here is published. Set{' '}
              <code className="code-chip">NEXT_PUBLIC_SITE_URL</code> to change it.
            </p>
            <a href={SITE_URL} target="_blank" rel="noreferrer" className="btn-ghost btn-sm mt-3 w-full">
              <IconExternal className="h-3.5 w-3.5" />
              {SITE_URL.replace(/^https?:\/\//, '')}
            </a>
          </section>
        </div>

        <section className="card overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy">
              <IconShield className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h2 className="section-title">Roles and permissions</h2>
              <p className="muted mt-0.5">
                Assign a role on the Admin users page. A role this panel does not recognise keeps
                full access, so existing accounts never lose anything.
              </p>
            </div>
          </div>

          <div className="table-scroll border-t border-slate-100">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr>
                  <th className="th">Permission</th>
                  {ROLES.filter((role) => role.id !== 'admin').map((role) => (
                    <th key={role.id} className="th text-center">
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((permission) => (
                  <tr key={permission} className="row">
                    <td className="td font-medium text-slate-700">
                      {PERMISSION_LABELS[permission] ?? permission}
                    </td>
                    {ROLES.filter((role) => role.id !== 'admin').map((role) => (
                      <td key={role.id} className="td text-center">
                        {can(role.id, permission) ? (
                          <IconCheck className="mx-auto h-4 w-4 text-emerald-600" />
                        ) : (
                          <IconClose className="mx-auto h-4 w-4 text-slate-300" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2.5 border-t border-slate-100 px-5 py-4">
            {ROLES.filter((role) => role.id !== 'admin').map((role) => (
              <li key={role.id} className="flex gap-2.5 text-sm">
                <span className="badge-neutral shrink-0">{role.label}</span>
                <span className="text-slate-500">{role.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
