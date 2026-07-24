import { Search } from "lucide-react";
import { Surface } from "@/design";
import { cn } from "@/ui/cn";
import { Button } from "@/ui/button";
import { useStore } from "./store";
import { rememberPaletteReturnFocus } from "./paletteFocus";

function SearchControl({ compact = false }: { compact?: boolean }) {
  const open = useStore((state) => state.paletteOpen);
  const setOpen = useStore((state) => state.setPaletteOpen);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={(event) => {
        rememberPaletteReturnFocus(event.currentTarget);
        setOpen(true);
      }}
      aria-label="Search concepts and theorems"
      aria-haspopup="dialog"
      aria-expanded={open}
      title="Search concepts and theorems"
      className={cn(
        "w-full justify-start gap-2 rounded-full font-normal text-muted-foreground motion-reduce:transition-none",
        compact ? "h-10 px-3.5 has-[>svg]:px-3.5" : "h-11 px-4 has-[>svg]:px-4",
        open && "text-foreground",
      )}
    >
      <Search className={cn("shrink-0", compact ? "size-4" : "size-[18px]", open && "text-primary-text")} aria-hidden />
      <span className={cn("shell-search-copy min-w-0 flex-1 truncate text-left", compact ? "text-subhead" : "text-body")}>
        Search concepts, theorems…
      </span>
      <kbd
        className={cn(
          "shell-search-shortcut shrink-0 rounded border border-border bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-caption-2 leading-none text-muted-foreground shadow-[0_1px_0_var(--border)]",
          open && "text-foreground",
        )}
      >
        ⌘K
      </kbd>
    </Button>
  );
}

export function PaletteSearchButton({ compact = false }: { compact?: boolean }) {
  const open = useStore((state) => state.paletteOpen);

  return (
    <Surface material="regular" data-state={open ? "open" : "closed"} className="rounded-full">
      <SearchControl compact={compact} />
    </Surface>
  );
}
