import * as Dialog from "@radix-ui/react-dialog";
import { CircleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Surface, spring } from "@/design";

/**
 * Small, blocking confirmation alert following the macOS alert hierarchy: one
 * compact thick-glass surface, a single decision, trailing actions ordered
 * cancel → default/destructive.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  icon,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild onEscapeKeyDown={(event) => busy && event.preventDefault()}>
              <motion.div
                role="alertdialog"
                className="fixed top-1/2 left-1/2 z-50 w-[min(340px,92vw)] -translate-x-1/2 -translate-y-1/2"
                initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
                transition={reduceMotion ? { duration: 0 } : spring.gentle}
              >
                <Surface material="thick" className="flex flex-col gap-4 p-5">
                  <div className="flex gap-3">
                    <div className={destructive ? "text-destructive" : "text-primary"} aria-hidden>
                      {icon ?? <CircleAlert className="size-6" />}
                    </div>
                    <div className="min-w-0">
                      <Dialog.Title className="text-headline font-semibold text-foreground">{title}</Dialog.Title>
                      <Dialog.Description className="mt-1 text-footnote leading-relaxed text-muted-foreground">
                        {description}
                      </Dialog.Description>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button type="button" variant="secondary" disabled={busy}>
                        {cancelLabel}
                      </Button>
                    </Dialog.Close>
                    <Button
                      type="button"
                      variant={destructive ? "destructive" : "default"}
                      disabled={busy}
                      onClick={() => void confirm()}
                    >
                      {busy ? "Working…" : confirmLabel}
                    </Button>
                  </div>
                </Surface>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
