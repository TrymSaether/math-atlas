import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { signOut, useSession } from "./client";
import { Button } from "@/ui/button";
import { Surface } from "@/design";
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
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-foreground"
          onClick={() => setDialogOpen(true)}
          aria-label="Sign in"
          title="Sign in"
        >
          <LogIn className="size-[18px]" />
        </Button>
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Account"
        title={user.email}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
          {initial}
        </span>
      </Button>
      {menuOpen && (
        <Surface
          material="thick"
          className="absolute top-[calc(100%+8px)] right-0 z-[var(--z-banner,60)] w-[min(240px,calc(100vw-24px))] p-1.5"
        >
          <div className="flex items-center gap-2 px-2 py-1.5">
            <User className="size-[18px] shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              {user.name && <div className="truncate text-footnote text-foreground">{user.name}</div>}
              <div className="truncate text-caption text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-2 font-normal"
            onClick={async () => {
              await signOut();
              setMenuOpen(false);
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </Surface>
      )}
    </div>
  );
}
