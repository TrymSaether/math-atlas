/**
 * The diagnostic model shared by every lint/validation pass. One flat record per
 * finding; the reporter owns presentation. Severities mirror the brief:
 *   error      — breaks the build (FK violations, schema failures, cycles)
 *   warning    — ships but is probably wrong (orphans, missing intuition)
 *   suggestion — a senior-reviewer nudge (likely-related concepts)
 */
export type Severity = "error" | "warning" | "suggestion";

export interface Diagnostic {
  severity: Severity;
  /** Stable machine code, e.g. `ref/missing-concept`. */
  code: string;
  /** Map id the finding belongs to. */
  map: string;
  /** Source filename for display. */
  file: string;
  /** Concept the finding is anchored to (drives the codeframe). */
  conceptId?: string;
  /** JSON-ish path for `--json` consumers. */
  path?: string;
  message: string;
  hint?: string;
}

export function error(d: Omit<Diagnostic, "severity">): Diagnostic {
  return { ...d, severity: "error" };
}
export function warning(d: Omit<Diagnostic, "severity">): Diagnostic {
  return { ...d, severity: "warning" };
}
export function suggestion(d: Omit<Diagnostic, "severity">): Diagnostic {
  return { ...d, severity: "suggestion" };
}

export function countBySeverity(diags: Diagnostic[]): Record<Severity, number> {
  const c: Record<Severity, number> = { error: 0, warning: 0, suggestion: 0 };
  for (const d of diags) c[d.severity] += 1;
  return c;
}
