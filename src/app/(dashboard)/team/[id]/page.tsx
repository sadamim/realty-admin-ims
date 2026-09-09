import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeamMember } from '@/lib/team';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import TeamEditor from '../TeamEditor';
import { IconArrowLeft } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [member, user] = await Promise.all([getTeamMember(id), getSessionUser()]);
  if (!member) notFound();

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

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
            {member.name || 'Untitled'}
          </h1>
          {member.active ? (
            <span className="badge-success">Live</span>
          ) : (
            <span className="badge-neutral">Hidden</span>
          )}
        </div>
      </div>

      <TeamEditor member={member} canWrite={can(user?.role, 'content.write')} />
    </div>
  );
}
