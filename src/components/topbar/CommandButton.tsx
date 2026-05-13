import { Command as CommandIcon } from "lucide-react";
import { Button } from "../ui";
import { useStore } from "../../store";

export function CommandButton() {
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  return (
    <Button variant="secondary" onClick={() => setPaletteOpen(true)} className="hidden sm:inline-flex">
      <CommandIcon className="h-3.5 w-3.5" />
      Search
      <kbd className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">⌘K</kbd>
    </Button>
  );
}
