import Skeleton, { SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-5">
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-72 rounded-card" />
        </div>
        <Skeleton className="h-[520px] rounded-card" />
      </div>
    </div>
  );
}
