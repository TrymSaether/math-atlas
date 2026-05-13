import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Section({
  title,
  icon,
  aside,
  className,
  children,
}: {
  title: string;
  icon?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
          {icon}
          <span>{title}</span>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
