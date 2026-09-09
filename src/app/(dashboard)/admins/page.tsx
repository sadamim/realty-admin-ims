import { listAdmins } from '@/lib/admin-data';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import AdminsTable from './AdminsTable';
import { IconInfo } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin users — Realty Focus Admin' };

export default async function AdminsPage() {
  const [admins, user] = await Promise.all([listAdmins() as Promise<any[]>, getSessionUser()]);
  const canManage = can(user?.role, 'users.write');

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Access"
        title="Admin users"
        description={
          <>
            Accounts in the <code className="code-chip">admin</code> collection. Passwords are never
            read into this page.
          </>
        }
      />

      <div className="card flex flex-col gap-1 border-navy-200 bg-navy-50/60 p-4 sm:flex-row sm:items-center sm:gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
          <IconInfo className="h-4 w-4" />
          {canManage ? 'You can manage accounts' : 'Read-only'}
        </p>
        <p className="text-sm text-navy-600">
          {canManage ? (
            <>
              Create and edit accounts here, or from the command line with{' '}
              <code className="code-chip">npm run create-admin</code>.
            </>
          ) : (
            <>Your role can view accounts but not change them. See Settings for what each role allows.</>
          )}
        </p>
      </div>

      <AdminsTable admins={admins} canManage={canManage} currentUserId={user?.id ?? ''} />
    </div>
  );
}
