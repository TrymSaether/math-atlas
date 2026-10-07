import { useState, type KeyboardEvent } from "react";
import { CornerDownLeft, HelpCircle, TerminalSquare } from "lucide-react";

/**
 * Bottom command bar — a lightweight launcher for tools and history actions.
 * Type a tool name (point, loop, "define U", "draw loop") or an action
 * (clear, undo, redo) and press Enter. `onRun` returns a feedback string.
 */
export function CommandBar({ onRun }: { onRun: (text: string) => string }) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    setFeedback(onRun(value));
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setValue("");
      setFeedback("");
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2.5 border-t px-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <TerminalSquare className="h-4 w-4 shrink-0" style={{ color: "var(--fg-3)" }} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a command…  (e.g. define U, draw loop, clear)"
        className="min-w-0 flex-1 bg-transparent text-ui-body outline-none"
        style={{ color: "var(--fg-1)", fontFamily: "var(--font-mono)" }}
        aria-label="Command input"
        spellCheck={false}
        autoComplete="off"
      />
      {feedback && (
        <span
          className="hidden shrink-0 truncate text-ui-xs sm:inline"
          style={{ color: "var(--fg-2)", maxWidth: "44%" }}
        >
          {feedback}
        </span>
      )}
      {value.trim() ? (
        <button
          type="button"
          onClick={submit}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: "var(--fg-2)" }}
          title="Run command"
          aria-label="Run command"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setFeedback(onRun("help"))}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: "var(--fg-3)" }}
          title="Command help"
          aria-label="Command help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
