import { cn } from "../../lib/utils";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white/85 outline-none transition hover:bg-white/[0.06] focus:border-accent-cyan/45 focus:ring-2 focus:ring-accent-cyan/10",
        className
      )}
    >
      {children}
    </select>
  );
}
