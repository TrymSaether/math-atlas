import { useCallback, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { getDomainTone } from "@/atlas/colors";
import { Surface } from "@/design";
import { cn } from "@/ui/cn";
import { MathText } from "@/math/MathText";
import { usePopoverDismiss } from "@/app/usePopover";

/* Shared authoring form-control class recipes (was styles/components/authoring.css). */
export const FIELD = "block";
const LABEL =
  "mb-1.5 block font-sans text-caption-1 font-semibold leading-tight tracking-[0.004em] text-muted-foreground";
const HINT = "ml-2 font-sans text-caption-1 font-medium text-muted-foreground/70";
export const CONTROL =
  "min-h-(--control-h-xl) w-full rounded-md border border-border/90 bg-card/80 px-3 py-2 text-footnote leading-[1.35] text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:border-input/80 hover:bg-card/90 focus:border-ring focus:bg-card focus:shadow-[0_0_0_1px_var(--ring)]";
export const CONTROL_MONO = "font-mono text-footnote";
const SELECT_TRIGGER =
  "flex items-center justify-between gap-2.5 text-left aria-expanded:border-ring aria-expanded:bg-card aria-expanded:shadow-[0_0_0_1px_var(--ring)]";
const SELECT_OPTION =
  "flex min-h-(--control-h-xl) w-full items-center justify-between gap-2.5 rounded-md px-2.5 py-1.5 text-left text-footnote text-muted-foreground transition hover:bg-accent hover:text-foreground";
const SELECT_OPTION_ACTIVE = "bg-primary/10 text-foreground";
const PICKER_OPTION =
  "flex min-h-(--control-h-xl) w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-footnote text-foreground hover:bg-secondary";
export const ACTION =
  "inline-flex min-h-(--control-h-xl) items-center justify-center gap-1.5 rounded-md border border-border bg-card font-semibold text-muted-foreground transition hover:border-input hover:bg-accent hover:text-foreground focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_16%,transparent)] focus-visible:outline-none active:scale-[0.98]";
export const ACTION_PRIMARY =
  "border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground";
export const ACTION_DANGER =
  "border-destructive/30 bg-destructive/[0.07] text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive";
export const CHIP =
  "inline-flex min-h-(--control-h-xl) items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 text-caption-1 font-semibold capitalize text-muted-foreground transition hover:border-input hover:bg-accent hover:text-foreground";
export const CHIP_ACTIVE = "border-primary/50 bg-primary/10 text-foreground";

export function FieldLabel({ label, hint }: { label?: string; hint?: string }) {
  if (!label) return null;
  return (
    <span className={LABEL}>
      {label}
      {hint && <span className={HINT}>{hint}</span>}
    </span>
  );
}

export function Field({
  label,
  value,
  onChange,
  area,
  mono,
  placeholder,
  hint,
  preview,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  mono?: boolean;
  placeholder?: string;
  hint?: string;
  /** Render a live KaTeX preview of the value beneath the control. */
  preview?: boolean;
}) {
  return (
    <label className={FIELD}>
      <FieldLabel label={label} hint={hint} />
      {area ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={cn(CONTROL, mono && CONTROL_MONO)}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(CONTROL, mono && CONTROL_MONO)}
        />
      )}
      {preview && value.trim() && (
        <span className="mt-1 block text-caption-1 text-muted-foreground">
          <MathText text={value} />
        </span>
      )}
    </label>
  );
}

type SelectOption = { value: string; label?: string };

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);
  const closeSelect = useCallback(() => setOpen(false), []);

  usePopoverDismiss({ open, onClose: closeSelect, containerRef: ref, triggerRef });

  return (
    <div className={FIELD} ref={ref}>
      <FieldLabel label={label} />
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          className={cn(CONTROL, SELECT_TRIGGER)}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate">{selected?.label ?? value}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        {open && (
          <Surface
            material="thick"
            role="listbox"
            className="absolute inset-x-0 top-[calc(100%+6px)] z-(--z-modal) max-h-[min(300px,42vh)] overflow-y-auto rounded-lg p-1.5"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(SELECT_OPTION, active && SELECT_OPTION_ACTIVE)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </Surface>
        )}
      </div>
    </div>
  );
}

/** Lightweight filterable picker over the map's nodes (for edge targets). */
export function NodePicker({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options.slice(0, 8);
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.id.includes(q)).slice(0, 8);
  }, [options, query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? query : (selected?.label ?? "")}
        placeholder={placeholder ?? "Search concept…"}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => setQuery(e.target.value)}
        className={CONTROL}
      />
      {open && matches.length > 0 && (
        <ul
          className="panel-scrollbar absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border p-1 shadow-(--shadow-e4)"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {matches.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.id);
                  setOpen(false);
                }}
                className={PICKER_OPTION}
                style={{ color: "var(--foreground)" }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: getDomainTone(o.id).color }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">
                  <MathText text={o.label} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
