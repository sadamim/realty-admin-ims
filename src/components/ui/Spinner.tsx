import { IconSpinner } from '@/components/icons';

export default function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <IconSpinner className={`animate-spin ${className}`} />;
}
