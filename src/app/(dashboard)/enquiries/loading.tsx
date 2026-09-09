import Skeleton, { SkeletonPageHeader, SkeletonTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
