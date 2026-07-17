/**
 * Text shaping helpers: turning authored TeX/prose into terminal-friendly lines.
 * The TeX→plain pass is deliberately lightweight — enough to read a statement in
 * the terminal, not a full renderer (that is what the app + KaTeX are for).
 */
import { visibleLength } from "./color.ts";

const TEX_REPLACEMENTS: [RegExp, string][] = [
  [/\\mathbb\{([A-Z])\}/g, "$1"],
  [/\\mathcal\{([A-Z])\}/g, "$1"],
  [/\\mathbf\{([^}]*)\}/g, "$1"],
  [/\\operatorname\{([^}]*)\}/g, "$1"],
  [/\\text\{([^}]*)\}/g, "$1"],
  [/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)"],
  [/\\sqrt\{([^}]*)\}/g, "√($1)"],
  [/\\to\b/g, "→"],
  [/\\mapsto\b/g, "↦"],
  [/\\rightarrow\b/g, "→"],
  [/\\leftarrow\b/g, "←"],
  [/\\Rightarrow\b/g, "⇒"],
  [/\\iff\b/g, "⇔"],
  [/\\leq\b/g, "≤"],
  [/\\geq\b/g, "≥"],
  [/\\neq\b/g, "≠"],
  [/\\subseteq\b/g, "⊆"],
  [/\\subset\b/g, "⊂"],
  [/\\supseteq\b/g, "⊇"],
  [/\\in\b/g, "∈"],
  [/\\notin\b/g, "∉"],
  [/\\cup\b/g, "∪"],
  [/\\cap\b/g, "∩"],
  [/\\emptyset\b/g, "∅"],
  [/\\varnothing\b/g, "∅"],
  [/\\infty\b/g, "∞"],
  [/\\forall\b/g, "∀"],
  [/\\exists\b/g, "∃"],
  [/\\partial\b/g, "∂"],
  [/\\nabla\b/g, "∇"],
  [/\\sum\b/g, "∑"],
  [/\\prod\b/g, "∏"],
  [/\\int\b/g, "∫"],
  [/\\langle\b/g, "⟨"],
  [/\\rangle\b/g, "⟩"],
  [/\\times\b/g, "×"],
  [/\\cdot\b/g, "·"],
  [/\\circ\b/g, "∘"],
  [/\\pm\b/g, "±"],
  [/\\alpha\b/g, "α"],
  [/\\beta\b/g, "β"],
  [/\\gamma\b/g, "γ"],
  [/\\delta\b/g, "δ"],
  [/\\epsilon\b/g, "ε"],
  [/\\varepsilon\b/g, "ε"],
  [/\\theta\b/g, "θ"],
  [/\\lambda\b/g, "λ"],
  [/\\mu\b/g, "μ"],
  [/\\pi\b/g, "π"],
  [/\\sigma\b/g, "σ"],
  [/\\tau\b/g, "τ"],
  [/\\phi\b/g, "φ"],
  [/\\varphi\b/g, "φ"],
  [/\\psi\b/g, "ψ"],
  [/\\omega\b/g, "ω"],
  [/\\Omega\b/g, "Ω"],
  [/\\Gamma\b/g, "Γ"],
  [/\\overline\{([^}]*)\}/g, "$1̄"],
  [/\\hat\{([^}]*)\}/g, "$1̂"],
  [/\\,/g, " "],
  [/\\;/g, " "],
  [/\\!/g, ""],
  [/\\quad\b/g, "  "],
  [/\\left/g, ""],
  [/\\right/g, ""],
  // Environment wrappers and aligned-block markup → readable separators.
  [/\\begin\{[^}]*\}/g, ""],
  [/\\end\{[^}]*\}/g, ""],
  [/\\\\/g, "; "],
];

/** Best-effort TeX → readable plain text for terminal study cards. */
export function texToPlain(tex: string): string {
  let s = tex;
  for (const [re, to] of TEX_REPLACEMENTS) s = s.replace(re, to);
  s = s
    .replace(/\$\$?/g, "")
    .replace(/&/g, "")
    .replace(/[{}]/g, "")
    .replace(/\^\{?([^\s}]+)\}?/g, "^$1")
    .replace(/_\{?([^\s}]+)\}?/g, "_$1")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

/** Truncate to `max` visible columns, appending an ellipsis when cut. */
export function truncate(s: string, max: number): string {
  if (visibleLength(s) <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + "…";
}

/** Pad to `width` visible columns (right pad / left align). */
export function padEnd(s: string, width: number): string {
  const len = visibleLength(s);
  return len >= width ? s : s + " ".repeat(width - len);
}

/** Pad to `width` visible columns (left pad / right align). */
export function padStart(s: string, width: number): string {
  const len = visibleLength(s);
  return len >= width ? s : " ".repeat(width - len) + s;
}

/** Word-wrap plain text to `width`, returning lines. */
export function wrap(s: string, width: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line.length === 0) line = w;
    else if (line.length + 1 + w.length <= width) line += " " + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function pluralize(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}
