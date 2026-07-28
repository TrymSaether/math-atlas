import { cn } from "@/ui/cn";
import { SearchTrigger } from "@/ui/search-field";
import { useStore } from "./store";
import { rememberPaletteReturnFocus } from "./paletteFocus";

function SearchControl({ compact = false }: { compact?: boolean }) {
  const open = useStore((state) => state.paletteOpen);
  const setOpen = useStore((state) => state.setPaletteOpen);

  return (
    <SearchTrigger
      onClick={(event) => {
        rememberPaletteReturnFocus(event.currentTarget);
        setOpen(true);
      }}
      aria-label="Search concepts and theorems"
      aria-haspopup="dialog"
      aria-expanded={open}
      title="Search concepts and theorems"
      appearance="toolbar"
      size={compact ? "regular" : "large"}
      compact={compact}
      shortcut="⌘K"
      className={cn(open && "border-primary/35 bg-primary/8")}
    >
      Search concepts, theorems…
    </SearchTrigger>
  );
}

export function PaletteSearchButton({ compact = false }: { compact?: boolean }) {
  return <SearchControl compact={compact} />;
}
