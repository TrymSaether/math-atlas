import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, CloudOff, HardDrive, LogIn, LogOut, Moon, Sun, User } from "lucide-react";
import { signOut, useSession } from "./client";
import { Button } from "@/ui/button";
import { Surface } from "@/design";
import { usePopoverDismiss } from "@/app/usePopover";
import { AuthDialog } from "./AuthDialog";
import { useStore } from "@/app/store";
import { schemeFor, siblingOf } from "@/app/themes";

/**
 * Top-bar account control. Signed out: opens the auth dialog. Signed in: shows
 * the account email and a sign-out action. Session state comes from better-auth's
 * reactive `useSession`, so it updates everywhere on sign in/out.
 */
export function UserMenu({ showLabel = false }: { showLabel?: boolean }) {
  const { data: session } = useSession();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const editedCount = useStore((s) => s.editedMaps.size);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  usePopoverDismiss({ open: menuOpen, onClose: closeMenu, containerRef: ref, triggerRef });

  useEffect(() => {
    if (!menuOpen) return;
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [menuOpen]);

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (Math.max(current, -1) + 1) % items.length
            : (current <= 0 ? items.length : current) - 1;
    items[next]?.focus();
  };

  const user = session?.user;
  const dark = schemeFor(theme) === "dark";
  const appearanceAction = (
    <Button
      variant="ghost"
      role="menuitem"
      className="w-full justify-start gap-2 font-normal text-foreground"
      onClick={() => setTheme(siblingOf(theme))}
    >
      {dark ? <Sun className="size-4 text-muted-foreground" /> : <Moon className="size-4 text-muted-foreground" />}
      {dark ? "Light appearance" : "Dark appearance"}
    </Button>
  );

  if (!user) {
    return (
      <div className="relative" ref={ref}>
        <Button
          ref={triggerRef}
          variant="ghost"
          size={showLabel ? "default" : "icon"}
          className={
            showLabel
              ? "h-9 gap-1.5 rounded-full px-2.5 text-footnote font-medium text-muted-foreground has-[>svg]:px-2.5"
              : "size-9 rounded-full text-muted-foreground"
          }
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Sign in"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="account-menu"
          title="Sign in"
        >
          <LogIn className="size-[18px]" />
          {showLabel && <span className="shell-account-label">Sign in</span>}
        </Button>
        {menuOpen && (
          <Surface
            ref={menuRef}
            id="account-menu"
            material="thick"
            className="shell-popover-present absolute top-[calc(100%+10px)] right-0 z-(--z-banner) w-[min(240px,calc(100vw-20px))] p-1.5"
            role="menu"
            aria-label="Account"
            onKeyDown={onMenuKeyDown}
          >
            <Button
              variant="ghost"
              role="menuitem"
              className="w-full justify-start gap-2 font-normal text-foreground"
              onClick={() => {
                setMenuOpen(false);
                setDialogOpen(true);
              }}
            >
              <LogIn className="size-4 text-muted-foreground" />
              Sign in
            </Button>
            {appearanceAction}
            <div
              role="none"
              className="mt-1 flex items-start gap-2 border-t border-border px-2 py-2 text-caption-2 leading-relaxed text-muted-foreground"
            >
              <HardDrive className="mt-0.5 size-3.5 shrink-0" />
              Progress and edits stay on this device until you sign in.
            </div>
          </Surface>
        )}
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size={showLabel ? "default" : "icon"}
        className={
          showLabel
            ? "h-9 gap-2 rounded-full px-1.5 pr-2.5 text-footnote font-medium has-[>svg]:px-1.5"
            : "size-9 rounded-full"
        }
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls="account-menu"
        title={user.email}
      >
        <span className="flex size-6.5 items-center justify-center rounded-full bg-primary text-caption font-semibold text-primary-foreground">
          {initial}
        </span>
        {showLabel && <span className="shell-account-label max-w-24 truncate text-footnote">{user.name || "Account"}</span>}
      </Button>
      {menuOpen && (
        <Surface
          ref={menuRef}
          id="account-menu"
          material="thick"
          className="shell-popover-present absolute top-[calc(100%+8px)] right-0 z-[var(--z-banner,60)] w-[min(240px,calc(100vw-24px))] p-1.5"
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
        >
          <div role="none" className="flex items-center gap-2 px-2 py-1.5">
            <User className="size-[18px] shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              {user.name && <div className="truncate text-footnote font-medium text-foreground">{user.name}</div>}
              <div className="truncate text-caption-2 text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div
            role="none"
            className="mx-1 my-1 flex items-center gap-2 rounded-md bg-muted/70 px-2 py-1.5 text-caption-2 text-muted-foreground"
          >
            {editedCount > 0 ? (
              <>
                <CloudOff className="size-3.5 shrink-0 text-primary-text" />
                {editedCount} {editedCount === 1 ? "field has" : "fields have"} local changes
              </>
            ) : (
              <>
                <Check className="size-3.5 shrink-0 text-success" />
                Map changes synced
              </>
            )}
          </div>
          {appearanceAction}
          <Button
            variant="ghost"
            role="menuitem"
            className="mt-1 w-full justify-start gap-2 font-normal"
            onClick={async () => {
              await signOut();
              setMenuOpen(false);
              requestAnimationFrame(() => triggerRef.current?.focus());
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
