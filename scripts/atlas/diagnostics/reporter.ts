/**
 * Diagnostic reporter — the TypeScript-compiler-flavoured printer. Groups by map,
 * prints a `severity code  map:concept` header, an optional codeframe, and a
 * trailing `hint:`. Ends with an aggregate summary line. `--json` callers bypass
 * this and serialise the raw Diagnostic[] instead.
 */
import { type Diagnostic, type Severity, countBySeverity } from "./diagnostic.ts";
import { frameForConcept } from "./codeframe.ts";
import { MARK } from "../utils/glyphs.ts";
import { red, yellow, cyan, green, dim, bold, gray } from "../utils/color.ts";

const SEV_STYLE: Record<Severity, { mark: string; paint: (s: string) => string; word: string }> = {
  error: { mark: MARK.error, paint: red, word: "error" },
  warning: { mark: MARK.warning, paint: yellow, word: "warning" },
  suggestion: { mark: MARK.suggestion, paint: cyan, word: "suggestion" },
};

interface ReportOptions {
  /** Raw source text per map id, for codeframes. */
  rawByMap?: Map<string, string>;
  /** Show codeframes (default true). */
  frames?: boolean;
  /** Hide suggestions unless asked. */
  showSuggestions?: boolean;
}

export function reportDiagnostics(diags: Diagnostic[], opts: ReportOptions = {}): void {
  const frames = opts.frames ?? true;
  const showSuggestions = opts.showSuggestions ?? true;
  const visible = diags.filter((d) => showSuggestions || d.severity !== "suggestion");

  const byMap = new Map<string, Diagnostic[]>();
  for (const d of visible) {
    const list = byMap.get(d.map) ?? [];
    list.push(d);
    byMap.set(d.map, list);
  }

  for (const [map, list] of byMap) {
    const file = list[0]?.file ?? map;
    process.stdout.write("\n" + bold(file) + "\n");
    for (const d of list) {
      const sev = SEV_STYLE[d.severity];
      const loc = d.conceptId ? ` ${dim("at")} ${d.conceptId}` : "";
      process.stdout.write(`  ${sev.paint(sev.mark + " " + sev.word)} ${gray(d.code)}${loc}\n` + `    ${d.message}\n`);
      const raw = opts.rawByMap?.get(d.map);
      if (frames && raw && d.conceptId) {
        const frame = frameForConcept(raw, d.conceptId);
        if (frame) process.stdout.write(frame + "\n");
      }
      if (d.hint) {
        process.stdout.write(`    ${dim("hint:")} ${dim(d.hint)}\n`);
      }
    }
  }

  printSummary(visible);
}

export function printSummary(diags: Diagnostic[]): void {
  const c = countBySeverity(diags);
  const parts: string[] = [];
  if (c.error) parts.push(red(`${MARK.error} ${c.error} error${c.error === 1 ? "" : "s"}`));
  if (c.warning) parts.push(yellow(`${MARK.warning} ${c.warning} warning${c.warning === 1 ? "" : "s"}`));
  if (c.suggestion) parts.push(cyan(`${MARK.suggestion} ${c.suggestion} suggestion${c.suggestion === 1 ? "" : "s"}`));

  process.stdout.write("\n");
  if (parts.length === 0) {
    process.stdout.write(green(`${MARK.ok} no issues found`) + "\n");
  } else {
    process.stdout.write(parts.join(dim("  ·  ")) + "\n");
  }
}
