import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Unchanged: the session gate stays on the server, in front of every page.
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return <AppShell user={user}>{children}</AppShell>;
}
