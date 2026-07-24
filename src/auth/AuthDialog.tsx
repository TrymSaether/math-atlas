import { Dialog } from "radix-ui";
import { useState } from "react";
import { X } from "lucide-react";
import { signIn, signInWithGoogle, signUp } from "./client";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { ModalShell } from "@/ui/modal-shell";
import { Surface } from "@/design";

type Mode = "signin" | "signup";

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Reset transient form state whenever the dialog closes.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setError(null);
      setBusy(false);
      setGoogleBusy(false);
      setPassword("");
    }
  }

  const continueWithGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    const result = await signInWithGoogle();
    setGoogleBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed.");
      return;
    }
    onOpenChange(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result =
      mode === "signin"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: name || email });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    onOpenChange(false);
  };

  const isSignup = mode === "signup";

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="inset-0 m-auto h-fit w-[min(380px,92vw)]"
    >
      <Dialog.Title className="sr-only">{isSignup ? "Create an account" : "Sign in"}</Dialog.Title>
      <Dialog.Description className="sr-only">Sign in to sync and share your maps.</Dialog.Description>
      <Surface material="thick" elevation="overlay" className="relative p-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 size-9 rounded-full text-muted-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="Close account dialog"
        >
          <X className="size-4" />
        </Button>
        <form onSubmit={submit} className="flex flex-col gap-3 p-5">
          <div className="pr-10">
            <h2 className="text-title-3 font-semibold text-foreground">
              {isSignup ? "Create an account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-footnote leading-relaxed text-muted-foreground">
              {isSignup
                ? "Save progress and keep map edits available across devices."
                : "Continue with your saved progress and map edits."}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || googleBusy}
            onClick={continueWithGoogle}
            className="h-11 gap-2"
          >
            <GoogleGIcon className="size-[18px] shrink-0" />
            {googleBusy ? "Opening Google…" : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-2 text-caption-2 font-semibold tracking-label-tight text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span>or</span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>
          {isSignup && (
            <Field
              label="Name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={setName}
              placeholder="Ada Lovelace"
            />
          )}
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {error && (
            <p className="text-caption font-medium text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy || googleBusy} className="mt-1 h-11">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </Button>

          <button
            type="button"
            className="text-caption text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError(null);
            }}
          >
            {isSignup ? "Already have an account? Sign in" : "No account yet? Create one"}
          </button>
        </form>
      </Surface>
    </ModalShell>
  );
}

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.72H.94v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.7A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.17.28-1.7V4.96H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.04l3.02-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.34l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .94 4.96L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-caption-2 font-semibold tracking-label-tight text-muted-foreground uppercase">{label}</span>
      <Input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="h-11" />
    </label>
  );
}
