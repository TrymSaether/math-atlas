import { useEffect, useRef, useState } from "react";
import { SignInIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { signOut, useSession } from "../../lib/authClient";
import { DockButton } from "../chrome/Pill";
import { Button } from "../chrome/Button";
import { AuthDialog } from "./AuthDialog";

/**
 * Top-bar account control. Signed out: opens the auth dialog. Signed in: shows
 * the account email and a sign-out action. Session state comes from better-auth's
 * reactive `useSession`, so it updates everywhere on sign in/out.
 */
export function UserMenu() {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const user = session?.user;

  if (!user) {
    return (
      <>
        <DockButton onClick={() => setDialogOpen(true)} label="Sign in" title="Sign in">
          <SignInIcon className="h-4 w-4" weight="regular" />
        </DockButton>
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <DockButton
        onClick={() => setMenuOpen((o) => !o)}
        active={menuOpen}
        label="Account"
        title={user.email}
      >
        <span className="flex h-4 w-4 items-center justify-center text-ui-2xs font-semibold">
          {initial}
        </span>
      </DockButton>
      {menuOpen && (
        <div className="map-popover absolute right-0 top-[calc(100%+8px)] z-50 w-[min(240px,calc(100vw-24px))] rounded-2xl p-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <UserIcon className="h-4 w-4 shrink-0 text-fg-3" />
            <div className="min-w-0">
              {user.name && <div className="truncate text-ui-control text-fg-1">{user.name}</div>}
              <div className="truncate text-ui-hint text-fg-3">{user.email}</div>
            </div>
          </div>
          <div className="map-divider my-1 h-px w-full" aria-hidden />
          <Button
            kind="text"
            onClick={async () => {
              await signOut();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-ui-control text-fg-2"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
