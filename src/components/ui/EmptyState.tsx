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
    <div className={cn("rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-center", className)}>
      {icon && <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]">{icon}</div>}
      <div className="text-sm font-medium text-[var(--text-soft)]">{title}</div>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--muted)]">{description}</p>}
    </div>
  );
}
