import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { spring } from "@/design";
import { cn } from "@/ui/cn";

export interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Positioning + width for the floating content (e.g. centered vs. top-anchored). */
  contentClassName: string;
  children: ReactNode;
  /** Forwarded to Dialog.Content — e.g. block Escape while a submit is in flight. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  role?: string;
  "aria-describedby"?: string;
}

/**
 * Shared floating-dialog shell: Radix Dialog wiring + backdrop fade + spring
 * entrance, at the `--z-modal` stacking tier. Every app modal (auth, confirm,
 * command palette) composes this instead of re-implementing the Root/Portal/
 * Overlay/Content boilerplate — callers only supply positioning and content.
 */
export function ModalShell({
  open,
  onOpenChange,
  contentClassName,
  children,
  onEscapeKeyDown,
  role,
  "aria-describedby": ariaDescribedby,
}: ModalShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                className="fixed inset-0 z-(--z-modal) bg-black/40 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild onEscapeKeyDown={onEscapeKeyDown} role={role} aria-describedby={ariaDescribedby}>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
                transition={reduceMotion ? { duration: 0 } : spring.gentle}
                className={cn("fixed z-(--z-modal)", contentClassName)}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
