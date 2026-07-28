import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/ui/cn";

const searchVariants = cva(
  "group/search inline-flex min-w-0 items-center gap-2 border text-foreground transition-[background-color,border-color,box-shadow] duration-[var(--duration-fast)] outline-none motion-reduce:transition-none",
  {
    variants: {
      appearance: {
        toolbar: "rounded-sm border-border/70 bg-background/60 shadow-[inset_0_0.5px_rgb(0_0_0/0.08)]",
        sidebar: "rounded-md border-transparent bg-foreground/[0.065] shadow-[inset_0_0.5px_rgb(0_0_0/0.08)]",
        content: "rounded-sm border-input bg-card shadow-[0_1px_1px_rgb(0_0_0/0.06)]",
      },
      size: {
        small: "h-(--control-h-sm) px-2 text-caption-1",
        regular: "h-(--control-h-md) px-2.5 text-footnote",
        large: "h-(--control-h-lg) px-3 text-subhead",
      },
    },
    defaultVariants: {
      appearance: "content",
      size: "regular",
    },
  },
);

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof searchVariants> {
  onClear?: () => void;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { appearance, size, className, value, defaultValue, onClear, disabled, ...props },
  ref,
) {
  const hasValue = String(value ?? defaultValue ?? "").length > 0;

  return (
    <div className={cn(searchVariants({ appearance, size }), disabled && "opacity-45", className)}>
      <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        className="min-w-0 flex-1 appearance-none bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          className="-mr-1 flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
});

export interface SearchTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof searchVariants> {
  shortcut?: string;
  compact?: boolean;
}

export const SearchTrigger = forwardRef<HTMLButtonElement, SearchTriggerProps>(function SearchTrigger(
  { appearance = "toolbar", size = "regular", shortcut, compact = false, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        searchVariants({ appearance, size }),
        "w-full text-left hover:bg-background/80 focus-visible:ring-[3px] focus-visible:ring-ring/45 active:bg-secondary",
        compact && "justify-center px-0",
        className,
      )}
      {...props}
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground group-hover/search:text-foreground" aria-hidden />
      {!compact && <span className="shell-search-copy min-w-0 flex-1 truncate text-muted-foreground">{children}</span>}
      {!compact && shortcut && (
        <kbd className="shell-search-shortcut shrink-0 rounded-[4px] border border-border/70 bg-background/55 px-1.5 py-0.5 font-mono text-caption-2 leading-none text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </button>
  );
});
