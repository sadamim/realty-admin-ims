import Link from 'next/link';
import { listTeam } from '@/lib/team';
import { getSessionUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import TeamList from './TeamList';
import { IconPlus, IconUserSquare } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team — Realty Focus Admin' };

export default async function TeamPage() {
  const [members, user] = await Promise.all([listTeam(), getSessionUser()]);
  const canWrite = can(user?.role, 'content.write');

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Content"
        title="Team"
        description="The people shown on the website's About page, in the order below."
        actions={
          canWrite && (
            <Link href="/team/new" className="btn-primary">
              <IconPlus className="h-4 w-4" />
              New team member
            </Link>
          )
        }
      />

      {members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={IconUserSquare}
            title="No team members yet"
            description="The About page skips the section entirely until there is at least one, so nothing looks half-finished in the meantime."
            actionLabel={canWrite ? 'Add the first person' : undefined}
            actionHref={canWrite ? '/team/new' : undefined}
          />
        </div>
      ) : (
        <TeamList members={members} canWrite={canWrite} />
      )}
    </div>
  );
}
