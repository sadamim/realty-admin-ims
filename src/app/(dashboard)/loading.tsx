import Skeleton, { SkeletonCards, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader />
      <SkeletonCards count={4} />
      <SkeletonCards count={4} />
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="card p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] rounded-xl" />
            ))}
          </div>
        </div>
        <div className="card p-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
