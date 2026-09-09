import Skeleton, { SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
