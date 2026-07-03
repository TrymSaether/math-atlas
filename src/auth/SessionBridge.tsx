import { useEffect, useRef } from "react";
import { useSession } from "./client";
import { useStore } from "@/app/store";

/**
 * Bridges the better-auth session into the store and keeps the map catalog in
 * sync with access changes. Renders nothing.
 *
 * - first resolve → refresh the catalog (the cache seeds it instantly on init).
 * - sign-in / sign-out → reload the catalog + active map (access changed: a
 *   user's editable forks and shared maps appear/disappear).
 *
 * Only mounted when `authEnabled` (dev, or a prod build with VITE_API_URL).
 */
export function SessionBridge() {
  const { data, isPending } = useSession();
  const userId = data?.user?.id ?? null;
  const setUserId = useStore((s) => s.setUserId);
  // `undefined` = not yet initialised; distinguishes first run from real changes.
  const prev = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (isPending) return; // wait for the session to resolve before acting
    setUserId(userId);

    const previous = prev.current;
    if (previous === userId) return;
    const firstRun = previous === undefined;
    prev.current = userId;

    if (firstRun) {
      void useStore.getState().loadCatalog();
    } else {
      void useStore.getState().onSessionChange();
    }
  }, [userId, isPending, setUserId]);

  // Detect a collaborator's save when the window regains focus.
  useEffect(() => {
    const onFocus = () => void useStore.getState().checkRemoteUpdate();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return null;
}
