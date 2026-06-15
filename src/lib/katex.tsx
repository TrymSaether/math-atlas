import katex from "katex";
import { useMemo } from "react";

export type MathSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

/**
 * Render text with inline TeX delimited by $...$ and display TeX by $$...$$,
 * plus Unicode math passthrough. Robust against unbalanced dollar signs.
 */
export function MathText({
  text,
  className,
  asBlock = false,
}: {
  text: string;
  className?: string;
  asBlock?: boolean;
}) {
  const html = useMemo(() => renderMathInString(text), [text]);
  const Tag = asBlock ? "div" : "span";
  return (
    <Tag
      className={className}
      // KaTeX produces trusted HTML from the source text we control.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function restoreAllowedInlineHtml(value: string): string {
  return value
    .replace(/&lt;(\/?)em&gt;/g, "<$1em>")
    .replace(/&lt;(\/?)i&gt;/g, "<$1em>")
    .replace(/&lt;(\/?)strong&gt;/g, "<$1strong>")
    .replace(/&lt;(\/?)b&gt;/g, "<$1strong>");
}

/** Lightweight LaTeX text-mode markup for prose segments outside $…$ math. */
function renderTextMarkup(value: string): string {
  return restoreAllowedInlineHtml(escape(value))
    .replace(/\\textbf\{([^{}]*)\}/g, "<strong>$1</strong>")
    .replace(/\\(?:textit|emph)\{([^{}]*)\}/g, "<em>$1</em>")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\;/g, " ")
    .replace(/\\ /g, " ");
}

function renderProseInString(text: string): string {
  return splitMathSegments(text)
    .map((segment) =>
      segment.type === "text"
        ? renderTextMarkup(segment.value)
        : renderKatex(segment.value, segment.display),
    )
    .join("");
}

/**
 * Like {@link MathText}, but also resolves common LaTeX text-mode markup
 * (\textbf, \textit/\emph, \text) in the prose between math spans. Used by the
 * dictionary view, whose curated statements mix prose and TeX.
 */
export function MathProse({
  text,
  className,
  asBlock = false,
}: {
  text: string;
  className?: string;
  asBlock?: boolean;
}) {
  const html = useMemo(() => renderProseInString(text), [text]);
  const Tag = asBlock ? "div" : "span";
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * PDF-extracted proofs arrive as raw Unicode math (𝛼, 𝑓, 𝑋…) with column-wrap
 * line breaks mid-sentence, combining accents detached from their base glyph
 * (𝛼 ̂), and stray spaces hugging brackets and punctuation. Tidy them into
 * flowing prose so they read cleanly in the math serif font. No semantic
 * rewriting — purely whitespace and glyph reattachment.
 */
export function tidyMathText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/[ \t]*\n[ \t]*/g, " ") // soft column wraps → spaces
    .replace(/\s+([̀-ͯ])/g, "$1") // reattach combining accents: 𝛼 ̂ → 𝛼̂
    .replace(/([([{])\s+/g, "$1") // drop space after an opening bracket
    .replace(/\s+([)\]}.,;:!?])/g, "$1") // drop space before a closing bracket / punctuation
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function renderKatex(src: string, display: boolean): string {
  try {
    return katex.renderToString(src, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      output: "html",
    });
  } catch {
    return escape(src);
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
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i--) slashCount += 1;
  return slashCount % 2 === 1;
}

function findNextMathStart(
  text: string,
  from: number,
): { start: number; open: string; close: string; display: boolean } | null {
  for (let i = from; i < text.length; i += 1) {
    if (text.startsWith("$$", i) && !isEscaped(text, i)) {
      return { start: i, open: "$$", close: "$$", display: true };
    }
    if (text[i] === "$" && !isEscaped(text, i)) {
      return { start: i, open: "$", close: "$", display: false };
    }
    if (text.startsWith("\\(", i)) {
      return { start: i, open: "\\(", close: "\\)", display: false };
    }
    if (text.startsWith("\\[", i)) {
      return { start: i, open: "\\[", close: "\\]", display: true };
    }
  }
  return null;
}

function findMathEnd(text: string, from: number, close: string): number {
  if (close !== "$" && close !== "$$") return text.indexOf(close, from);

  for (let i = from; i < text.length; i += 1) {
    if (text.startsWith(close, i) && !isEscaped(text, i)) return i;
  }
  return -1;
}

export function renderMathInString(text: string): string {
  return splitMathSegments(text)
    .map((segment) =>
      segment.type === "text" ? escape(segment.value) : renderKatex(segment.value, segment.display),
    )
    .join("");
}
