import { useEffect, useRef, useState } from "react";
import { SignInIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { signOut, useSession } from "../../lib/authClient";
import { Glass, ShellButton, ShellIconButton } from "../primitives";
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
        <ShellIconButton onClick={() => setDialogOpen(true)} aria-label="Sign in" title="Sign in">
          <SignInIcon className="shell-icon" weight="regular" />
        </ShellIconButton>
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <ShellIconButton onClick={() => setMenuOpen((o) => !o)} active={menuOpen} aria-label="Account" title={user.email}>
        <span className="shell-account-initial">{initial}</span>
      </ShellIconButton>
      {menuOpen && (
        <Glass
          material="thick"
          className="shell-panel shell-account-menu absolute right-0 top-[calc(100%+8px)] z-50 w-[min(240px,calc(100vw-24px))]"
        >
          <div className="shell-account-summary">
            <UserIcon className="shell-icon shrink-0 text-fg-3" />
            <div className="min-w-0">
              {user.name && <div className="truncate text-footnote text-fg-1">{user.name}</div>}
              <div className="truncate text-caption-2 text-fg-3">{user.email}</div>
            </div>
          </div>
          <ShellButton
            onClick={async () => {
              await signOut();
              setMenuOpen(false);
            }}
            shape="pill"
            className="shell-menu-option shell-menu-action"
          >
            <SignOutIcon className="shell-icon" />
            Sign out
          </ShellButton>
        </Glass>
      )}
    </div>
  );
}
