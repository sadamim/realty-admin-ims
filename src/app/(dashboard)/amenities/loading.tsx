import Skeleton, { SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="card flex flex-col items-center p-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="mt-3 h-3 w-16" />
            <Skeleton className="mt-2 h-2.5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
