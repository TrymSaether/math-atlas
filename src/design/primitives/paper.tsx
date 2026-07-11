import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/cn";
import "./paper.css";

const paperVariants = cva("paper", {
  variants: {
    elevation: {
      flat: "paper--flat",
      subtle: "paper--subtle",
      card: "paper--card",
      raised: "paper--raised",
    },
    interactive: {
      true: "paper--interactive",
      false: "",
    },
    selected: {
      true: "paper--selected",
      false: "",
    },
  },
  defaultVariants: {
    elevation: "flat",
    interactive: false,
    selected: false,
  },
});

export interface PaperProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof paperVariants> {}

/** Paper — the flat content-surface companion to glass Surface. */
export const Paper = forwardRef<HTMLDivElement, PaperProps>(function Paper(
  { className, elevation, interactive, selected, ...props },
  ref,
) {
  return <div ref={ref} className={cn(paperVariants({ elevation, interactive, selected }), className)} {...props} />;
});
