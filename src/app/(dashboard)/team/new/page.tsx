import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import TeamEditor from '../TeamEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New team member — Realty Focus Admin' };

export default async function NewTeamMemberPage() {
  const user = await getSessionUser();
  if (!can(user?.role, 'content.write')) redirect('/team');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to team
        </Link>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          New team member
        </h1>
        <p className="mt-1 text-sm text-slate-500">New people are added to the end of the order.</p>
      </div>

      <TeamEditor member={null} canWrite />
    </div>
  );
}
