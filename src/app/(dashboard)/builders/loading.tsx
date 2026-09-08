import { SkeletonPageHeader, SkeletonTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={4} />
    </div>
  );
}
