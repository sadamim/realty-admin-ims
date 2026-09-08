import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-3.5 w-32" />
        <div className="mt-3 flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-7 w-72 max-w-full" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card space-y-6 p-6">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-2 h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>

        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-4 w-28" />
              <div className="mt-4 space-y-2.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-10/12" />
                <Skeleton className="h-3 w-8/12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
