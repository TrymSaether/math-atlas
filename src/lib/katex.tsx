import katex from "katex";
import { useMemo } from "react";

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

function renderTeX(src: string, display: boolean): string {
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

export function renderMathInString(text: string): string {
  // First pass: $$...$$
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    const dd = text.indexOf("$$", i);
    if (dd === -1) {
      parts.push(processInline(text.slice(i)));
      break;
    }
    parts.push(processInline(text.slice(i, dd)));
    const end = text.indexOf("$$", dd + 2);
    if (end === -1) {
      parts.push(processInline(text.slice(dd)));
      break;
    }
    parts.push(renderTeX(text.slice(dd + 2, end), true));
    i = end + 2;
  }
  return parts.join("");
}

function processInline(seg: string): string {
  let out = "";
  let i = 0;
  while (i < seg.length) {
    const d = seg.indexOf("$", i);
    if (d === -1) {
      out += escape(seg.slice(i));
      break;
    }
    out += escape(seg.slice(i, d));
    const end = seg.indexOf("$", d + 1);
    if (end === -1) {
      out += escape(seg.slice(d));
      break;
    }
    out += renderTeX(seg.slice(d + 1, end), false);
    i = end + 1;
  }
  return out;
}
