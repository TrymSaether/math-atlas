import { cn } from "../../lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--field)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--faint)] focus:border-[rgba(var(--primary-rgb),0.45)] focus:bg-[var(--surface-strong)] focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.12)]",
        className
      )}
    />
  );
}
