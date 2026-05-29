import katex from "katex";
import { useMemo } from "react";

export type MathSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

/**
 * Render text with inline TeX delimited by $...$ and display TeX by $$...$$,
 * plus Unicode math passthrough. Robust against unbalanced dollar signs.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMathInString(text), [text]);
  return (
    <span
      className={className}
      // KaTeX produces trusted HTML from the source text we control.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
    const displayStart = text.indexOf("$$", index);
    const inlineStart = text.indexOf("$", index);

    let start = -1;
    let display = false;

    if (displayStart !== -1 && (inlineStart === -1 || displayStart <= inlineStart)) {
      start = displayStart;
      display = true;
    } else if (inlineStart !== -1) {
      start = inlineStart;
    }

    if (start === -1) {
      segments.push({ type: "text", value: text.slice(index) });
      break;
    }

    if (start > index) {
      segments.push({ type: "text", value: text.slice(index, start) });
    }

    const delimiter = display ? "$$" : "$";
    const end = text.indexOf(delimiter, start + delimiter.length);
    if (end === -1) {
      segments.push({ type: "text", value: text.slice(start) });
      break;
    }

    segments.push({ type: "math", value: text.slice(start + delimiter.length, end), display });
    index = end + delimiter.length;
  }

  return segments;
}

export function renderMathInString(text: string): string {
  return splitMathSegments(text)
    .map((segment) => (segment.type === "text" ? escape(segment.value) : renderKatex(segment.value, segment.display)))
    .join("");
}
