import { useEffect, useId, useMemo, useState } from "react";

import { cn } from "../lib/utils";

const SVG_CACHE = new Map<string, string>();

function withBasePath(src: string): string {
  if (!src.startsWith("/") || src.startsWith(import.meta.env.BASE_URL)) {
    return src;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${src}`;
}

function scrubSvg(markup: string): string {
  return markup
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namespaceSvgIds(markup: string, prefix: string): string {
  const ids = [...markup.matchAll(/\bid=(["'])([^"']+)\1/g)].map((match) => match[2]);
  if (ids.length === 0) return markup;

  let next = markup;
  for (const id of new Set(ids)) {
    const namespaced = `${prefix}-${id}`;
    const escaped = escapeRegExp(id);
    next = next
      .replace(new RegExp(`\\bid=(["'])${escaped}\\1`, "g"), `id="${namespaced}"`)
      .replace(new RegExp(`url\\(#${escaped}\\)`, "g"), `url(#${namespaced})`)
      .replace(new RegExp(`(["'])#${escaped}\\1`, "g"), `"#${namespaced}"`);
  }
  return next;
}

export function ThemedDiagram({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const resolvedSrc = useMemo(() => withBasePath(src), [src]);
  const [markup, setMarkup] = useState(() => SVG_CACHE.get(resolvedSrc) ?? "");
  const [failed, setFailed] = useState(false);
  const renderedMarkup = useMemo(
    () => (markup ? namespaceSvgIds(markup, `dia-${instanceId}`) : ""),
    [instanceId, markup],
  );

  useEffect(() => {
    const cached = SVG_CACHE.get(resolvedSrc);
    if (cached) {
      setMarkup(cached);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setMarkup("");
    setFailed(false);

    fetch(resolvedSrc)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load diagram: ${resolvedSrc}`);
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        const clean = scrubSvg(text);
        SVG_CACHE.set(resolvedSrc, clean);
        setMarkup(clean);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedSrc]);

  if (failed || !renderedMarkup) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("themed-diagram", className)}
      />
    );
  }

  return (
    <div
      className={cn("themed-diagram", className)}
      role="img"
      aria-label={alt}
      style={{ width: "100%", height: "auto" }}
      dangerouslySetInnerHTML={{ __html: renderedMarkup }}
    />
  );
}
