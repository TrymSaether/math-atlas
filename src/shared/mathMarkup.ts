import katex from "katex";

export type MathSegment = { type: "text"; value: string } | { type: "math"; value: string; display: boolean };

function escape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function restoreAllowedInlineHtml(value: string): string {
  return value
    .replace(/&lt;(\/?)em&gt;/g, "<$1em>")
    .replace(/&lt;(\/?)i&gt;/g, "<$1em>")
    .replace(/&lt;(\/?)strong&gt;/g, "<$1strong>")
    .replace(/&lt;(\/?)b&gt;/g, "<$1strong>");
}

function renderTextMarkup(value: string): string {
  return restoreAllowedInlineHtml(escape(value))
    .replace(/\\textbf\{([^{}]*)\}/g, "<strong>$1</strong>")
    .replace(/\\(?:textit|emph)\{([^{}]*)\}/g, "<em>$1</em>")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\;/g, " ")
    .replace(/\\ /g, " ");
}

/** Normalize whitespace and detached combining marks from PDF-extracted math prose. */
export function tidyMathText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/[ \t]*\n[ \t]*/g, " ")
    .replace(/\s+([̀-ͯ])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function renderKatex(source: string, display: boolean): string {
  try {
    return katex.renderToString(source, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      output: "html",
    });
  } catch {
    return escape(source);
  }
}

export function splitMathSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let index = 0;

  while (index < text.length) {
    const next = findNextMathStart(text, index);
    if (!next) {
      segments.push({ type: "text", value: text.slice(index) });
      break;
    }
    if (next.start > index) {
      segments.push({ type: "text", value: text.slice(index, next.start) });
    }

    const contentStart = next.start + next.open.length;
    const end = findMathEnd(text, contentStart, next.close);
    if (end === -1) {
      segments.push({ type: "text", value: text.slice(next.start) });
      break;
    }

    segments.push({ type: "math", value: text.slice(contentStart, end), display: next.display });
    index = end + next.close.length;
  }

  return segments;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}

function findNextMathStart(
  text: string,
  from: number,
): { start: number; open: string; close: string; display: boolean } | null {
  for (let index = from; index < text.length; index += 1) {
    if (text.startsWith("$$", index) && !isEscaped(text, index)) {
      return { start: index, open: "$$", close: "$$", display: true };
    }
    if (text[index] === "$" && !isEscaped(text, index)) {
      return { start: index, open: "$", close: "$", display: false };
    }
    if (text.startsWith("\\(", index)) {
      return { start: index, open: "\\(", close: "\\)", display: false };
    }
    if (text.startsWith("\\[", index)) {
      return { start: index, open: "\\[", close: "\\]", display: true };
    }
  }
  return null;
}

function findMathEnd(text: string, from: number, close: string): number {
  if (close !== "$" && close !== "$$") return text.indexOf(close, from);
  for (let index = from; index < text.length; index += 1) {
    if (text.startsWith(close, index) && !isEscaped(text, index)) return index;
  }
  return -1;
}

export function renderMathInString(text: string): string {
  return splitMathSegments(text)
    .map((segment) => (segment.type === "text" ? escape(segment.value) : renderKatex(segment.value, segment.display)))
    .join("");
}

export function renderProseInString(text: string): string {
  return splitMathSegments(text)
    .map((segment) =>
      segment.type === "text" ? renderTextMarkup(segment.value) : renderKatex(segment.value, segment.display),
    )
    .join("");
}
