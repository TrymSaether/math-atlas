import { cn } from "../../lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 text-sm text-[var(--text-soft)] outline-none transition hover:bg-[var(--surface-hover)] focus:border-[rgba(var(--primary-rgb),0.45)] focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.12)]",
        className
      )}
    >
      {children}
    </select>
  );
}
