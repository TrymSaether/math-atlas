import { HelpCircle, TerminalSquare } from "lucide-react";

/**
 * Bottom command bar. Presentational in this pass — the natural-language command
 * grammar (define U, draw loop, check membership) is a future hook; today the
 * tool rail drives construction.
 */
export function CommandBar() {
  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2.5 border-t px-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <TerminalSquare className="h-4 w-4 shrink-0" style={{ color: "var(--fg-3)" }} />
      <input
        type="text"
        disabled
        placeholder="Type a command…  (e.g. define U, draw loop, check membership)"
        className="flex-1 bg-transparent text-ui-body outline-none placeholder:opacity-90"
        style={{ color: "var(--fg-1)", fontFamily: "var(--font-mono)" }}
        aria-label="Command input"
      />
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-2)]"
        style={{ color: "var(--fg-3)" }}
        title="Command help"
        aria-label="Command help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
