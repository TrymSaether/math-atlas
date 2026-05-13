import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function EmptyState({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-center", className)}>
      {icon && <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45">{icon}</div>}
      <div className="text-sm font-medium text-white/75">{title}</div>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/42">{description}</p>}
    </div>
  );
}
