import * as Dialog from "@radix-ui/react-dialog";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Material } from "./Material";
import { ShellButton } from "./Button";

/**
 * Small, blocking confirmation alert. It follows the macOS alert hierarchy:
 * one compact thick-material surface, a single decision, and trailing actions
 * ordered cancel → default/destructive.
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
                className="shell-dialog-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild onEscapeKeyDown={(event) => busy && event.preventDefault()}>
              <motion.div
                role="alertdialog"
                className="shell-alert-position"
                initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <Material thickness="thick" className="shell-alert-dialog">
                  <div className="shell-alert-copy">
                    <div className="shell-alert-icon" aria-hidden>
                      {icon ?? <WarningCircleIcon weight="regular" />}
                    </div>
                    <div className="min-w-0">
                      <Dialog.Title className="shell-alert-title">{title}</Dialog.Title>
                      <Dialog.Description className="shell-alert-description">{description}</Dialog.Description>
                    </div>
                  </div>
                  <div className="shell-alert-actions">
                    <Dialog.Close asChild>
                      <ShellButton type="button" disabled={busy} className="shell-alert-action">
                        {cancelLabel}
                      </ShellButton>
                    </Dialog.Close>
                    <ShellButton
                      type="button"
                      primary={!destructive}
                      destructive={destructive}
                      disabled={busy}
                      className="shell-alert-action"
                      onClick={() => void confirm()}
                    >
                      {busy ? "Working…" : confirmLabel}
                    </ShellButton>
                  </div>
                </Material>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
