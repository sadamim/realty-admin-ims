import Skeleton, { SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card flex flex-col overflow-hidden sm:flex-row">
          <Skeleton className="aspect-[21/9] w-full rounded-none sm:aspect-auto sm:h-[150px] sm:w-[266px]" />
          <div className="flex-1 space-y-3 p-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-8 w-40 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
