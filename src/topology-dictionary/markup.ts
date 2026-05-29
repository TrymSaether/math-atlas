import { renderKatex, splitMathSegments } from "../lib/katex";

const SPECIAL_HTML = /[&<>"']/g;

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(SPECIAL_HTML, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function highlight(text: unknown, query: string): string {
  const value = String(text ?? "");
  if (!query) return escapeHtml(value);

  const index = value.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return escapeHtml(value);

  return [
    escapeHtml(value.slice(0, index)),
    "<mark>",
    escapeHtml(value.slice(index, index + query.length)),
    "</mark>",
    escapeHtml(value.slice(index + query.length)),
  ].join("");
}

export function processInlineMarkup(value: unknown): string {
  const source = String(value ?? "");
  return splitMathSegments(source)
    .map((segment) => {
      if (segment.type === "math") {
        return renderKatex(segment.value, segment.display);
      }

      return renderTextMarkup(segment.value);
    })
    .join("");
}

function renderTextMarkup(value: string): string {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/\\textbf\{([^{}]*)\}/g, "<strong>$1</strong>")
    .replace(/\\(?:textit|emph)\{([^{}]*)\}/g, "<em>$1</em>")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\;/g, " ")
    .replace(/\\ /g, " ");
}
