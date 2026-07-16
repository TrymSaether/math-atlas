import { Dialog } from "radix-ui";
import { CircleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { ModalShell } from "./modal-shell";
import { Surface } from "@/design";

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
    <ModalShell
      open={open}
      onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}
      onEscapeKeyDown={(event) => busy && event.preventDefault()}
      role="alertdialog"
      contentClassName="top-1/2 left-1/2 w-[min(340px,92vw)] -translate-x-1/2 -translate-y-1/2"
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
    </ModalShell>
  );
}
