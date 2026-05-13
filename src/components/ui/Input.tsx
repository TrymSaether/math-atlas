import { cn } from "../../lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/88 outline-none transition placeholder:text-white/30 focus:border-accent-cyan/45 focus:bg-black/25 focus:ring-2 focus:ring-accent-cyan/10",
        className
      )}
    />
  );
}
