import { listAdmins } from '@/lib/admin-data';
import PageHeader from '@/components/PageHeader';
import AdminsTable from './AdminsTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin users — Realty Focus Admin' };

export default async function AdminsPage() {
  const admins = (await listAdmins()) as any[];

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
        <p className="text-sm font-semibold text-navy-800">Adding or resetting an account</p>
        <p className="text-sm text-navy-600">
          Run <code className="code-chip">npm run create-admin -- --email someone@example.com</code>{' '}
          from the project root.
        </p>
      </div>

      <AdminsTable admins={admins} />
    </div>
  );
}
