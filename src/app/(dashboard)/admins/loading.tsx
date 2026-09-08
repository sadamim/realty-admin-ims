import Skeleton, { SkeletonPageHeader, SkeletonTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      <Skeleton className="h-16 w-full rounded-card" />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
