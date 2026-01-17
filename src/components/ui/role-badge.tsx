import { cn } from '@/lib/utils';
import { AppRole } from '@/lib/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/dependency-rules';

interface RoleBadgeProps {
  role: AppRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colors = ROLE_COLORS[role];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      colors.bg,
      colors.border,
      colors.text,
      className
    )}>
      {ROLE_LABELS[role]}
    </span>
  );
}
