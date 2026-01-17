import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '@/lib/dependency-rules';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
