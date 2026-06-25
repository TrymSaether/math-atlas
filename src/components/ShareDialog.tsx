import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrashIcon, LinkSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import { listCollaborators, addCollaborator, removeCollaborator, type Collaborator } from "../data/mapsApi";
import { shareUrl } from "../hooks/useUrlSync";
import { Button } from "./chrome/Button";

/**
 * Manage collaborators on an owned map (Phase 4). Invite by email; collaborators
 * get editor access and the map appears under "shared with me" for them.
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
                className="fixed inset-0 z-60 backdrop-blur-[2px]"
                style={{ background: "color-mix(in srgb, var(--bg-deep) 55%, transparent)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed left-1/2 top-1/2 z-60 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2">
                <Dialog.Title className="sr-only">Share {title}</Dialog.Title>
                <Dialog.Description className="sr-only">Invite collaborators to edit this map.</Dialog.Description>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.2, 0.7, 0.2, 1] }}
                  className="glass-thick flex flex-col gap-3 rounded-2xl p-5"
                >
                  <h2 className="font-serif text-lg text-fg-1">Share “{title}”</h2>
                  <p className="text-ui-hint text-fg-3">
                    Invite people by the email they signed up with. They’ll be able to edit.
                  </p>

                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-ui-control font-medium text-fg-1"
                    style={{
                      background: "color-mix(in srgb, var(--surface) 70%, transparent)",
                      boxShadow: "inset 0 0 0 1px var(--chrome-border)",
                    }}
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-accent" weight="bold" />
                    ) : (
                      <LinkSimpleIcon className="h-4 w-4" />
                    )}
                    {copied ? "Link copied" : "Copy link to this view"}
                  </button>

                  <form onSubmit={invite} className="flex items-end gap-2">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">
                        Email
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="h-10 rounded-md px-3 text-ui-control text-fg-1 outline-none"
                        style={{
                          background: "color-mix(in srgb, var(--surface) 80%, transparent)",
                          boxShadow: "inset 0 0 0 1px var(--chrome-border)",
                        }}
                      />
                    </label>
                    <Button
                      kind="field"
                      accent
                      type="submit"
                      disabled={busy}
                      className="h-10 justify-center rounded-md px-4 text-ui-control font-medium text-fg-on-color"
                    >
                      {busy ? "…" : "Invite"}
                    </Button>
                  </form>

                  {error && (
                    <p className="text-ui-hint font-medium text-danger" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="flex flex-col gap-1">
                    {collabs.length === 0 ? (
                      <p className="text-ui-hint text-fg-3">No collaborators yet.</p>
                    ) : (
                      collabs.map((c) => (
                        <div
                          key={c.userId}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5"
                          style={{ background: "color-mix(in srgb, var(--surface) 60%, transparent)" }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-ui-control text-fg-1">{c.email}</div>
                            <div className="text-ui-2xs uppercase tracking-label-wide text-fg-3">{c.role}</div>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${c.email}`}
                            onClick={async () => {
                              await removeCollaborator(mapEntityId, c.userId);
                              refresh();
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-sm text-fg-3 hover:bg-(--surface-3) hover:text-(--danger)"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
