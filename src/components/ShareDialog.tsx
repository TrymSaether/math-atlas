import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, Link2, Trash2 } from "lucide-react";
import { listCollaborators, addCollaborator, removeCollaborator, type Collaborator } from "../data/mapsApi";
import { shareUrl } from "../hooks/useUrlSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface, spring } from "@/design";

/**
 * Manage collaborators on an owned map. Invite by email; collaborators get editor
 * access and the map appears under "shared with me" for them.
 */
export function ShareDialog({
  open,
  onOpenChange,
  mapEntityId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapEntityId: string;
  title: string;
}) {
  const reduceMotion = useReducedMotion();
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const refresh = () => {
    listCollaborators(mapEntityId)
      .then(setCollabs)
      .catch(() => setCollabs([]));
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mapEntityId]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const res = await addCollaborator(mapEntityId, email.trim(), "editor");
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEmail("");
    refresh();
  };

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
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
                transition={reduceMotion ? { duration: 0 } : spring.gentle}
                className="fixed top-1/2 left-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2"
              >
                <Dialog.Title className="sr-only">Share {title}</Dialog.Title>
                <Dialog.Description className="sr-only">Invite collaborators to edit this map.</Dialog.Description>
                <Surface material="thick" className="flex flex-col gap-3 p-5">
                  <h2 className="text-title-3 font-semibold text-foreground">Share “{title}”</h2>
                  <p className="text-caption text-muted-foreground">
                    Invite people by the email they signed up with. They’ll be able to edit.
                  </p>

                  <Button type="button" variant="secondary" onClick={copyLink} className="h-11 gap-2">
                    {copied ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
                    {copied ? "Link copied" : "Copy link to this view"}
                  </Button>

                  <form onSubmit={invite} className="flex items-end gap-2">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                        Email
                      </span>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="h-11"
                      />
                    </label>
                    <Button type="submit" disabled={busy} className="h-11">
                      {busy ? "…" : "Invite"}
                    </Button>
                  </form>

                  {error && (
                    <p className="text-caption font-medium text-destructive" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="flex flex-col gap-1">
                    {collabs.length === 0 ? (
                      <p className="text-caption text-muted-foreground">No collaborators yet.</p>
                    ) : (
                      collabs.map((c) => (
                        <div key={c.userId} className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-footnote text-foreground">{c.email}</div>
                            <div className="text-caption tracking-wide text-muted-foreground uppercase">{c.role}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${c.email}`}
                            onClick={async () => {
                              await removeCollaborator(mapEntityId, c.userId);
                              refresh();
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
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
