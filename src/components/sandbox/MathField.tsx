/**
 * Thin React wrapper around MathLive's `<math-field>` web component.
 *
 * The editor speaks ASCIIMath in both directions: the stored row `source` is an
 * ASCIIMath string (which round-trips cleanly through MathLive and is close to
 * mathjs syntax). We guard external `setValue` against our own `input` events
 * via `lastEmitted` so the caret never jumps while typing.
 */

import { useEffect, useRef } from "react";
import { MathfieldElement } from "mathlive";

// Configure MathLive once. Pull fonts/sounds from a CDN so we don't have to
// wire asset copying into Vite. Sounds are disabled outright.
let configured = false;
function configureMathlive() {
  if (configured) return;
  configured = true;
  const base = "https://cdn.jsdelivr.net/npm/mathlive@0.109.2/dist";
  MathfieldElement.fontsDirectory = `${base}/fonts`;
  MathfieldElement.soundsDirectory = null;
}

export interface MathFieldProps {
  value: string;
  onChange: (source: string) => void;
  onEnter?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

export function MathField({
  value,
  onChange,
  onEnter,
  onFocus,
  autoFocus,
  placeholder,
  ariaLabel,
}: MathFieldProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const mfRef = useRef<MathfieldElement | null>(null);
  const lastEmitted = useRef(value);
  // Keep callbacks fresh without re-mounting the field. Updated after commit
  // (not during render) so the long-lived event listeners always see the latest.
  const cbs = useRef({ onChange, onEnter, onFocus });
  useEffect(() => {
    cbs.current = { onChange, onEnter, onFocus };
  });

  useEffect(() => {
    configureMathlive();
    const mf = new MathfieldElement();
    mf.mathVirtualKeyboardPolicy = "manual";
    mf.smartMode = false;
    if (placeholder) mf.setAttribute("placeholder", placeholder);
    if (ariaLabel) mf.setAttribute("aria-label", ariaLabel);
    mf.style.display = "block";
    mf.style.width = "100%";
    mf.style.border = "none";
    mf.style.outline = "none";
    mf.style.background = "transparent";
    mf.style.fontSize = "13.25px";
    mf.style.setProperty("--contains-highlight-background-color", "transparent");

    mf.setValue(value, { format: "ascii-math" });
    lastEmitted.current = value;

    mf.addEventListener("input", () => {
      const next = mf.getValue("ascii-math");
      lastEmitted.current = next;
      cbs.current.onChange(next);
    });
    mf.addEventListener("focusin", () => cbs.current.onFocus?.());
    mf.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        cbs.current.onEnter?.();
      }
    });

    hostRef.current?.appendChild(mf);
    mfRef.current = mf;
    if (autoFocus) requestAnimationFrame(() => mf.focus());

    return () => {
      mf.remove();
      mfRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect external value changes (e.g. loading a workspace) without clobbering
  // in-progress typing.
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;
    if (value !== lastEmitted.current) {
      mf.setValue(value, { format: "ascii-math" });
      lastEmitted.current = value;
    }
  }, [value]);

  return <span ref={hostRef} className="mf-host block w-full" />;
}
