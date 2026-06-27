import { useMemo } from "react";
import { renderMathInString, renderProseInString } from "./katexText";

/** Render inline/display TeX delimiters and Unicode math passthrough. */
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

/** Render TeX plus the lightweight text-mode markup used by curated prose. */
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
