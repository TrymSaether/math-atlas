import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { signIn, signUp } from "../../lib/authClient";
import { Button } from "../chrome/Button";

type Mode = "signin" | "signup";

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset transient form state whenever the dialog closes.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setError(null);
      setBusy(false);
      setPassword("");
    }
  }

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
                className="fixed inset-0 z-50 backdrop-blur-[2px]"
                style={{ background: "color-mix(in srgb, var(--bg-deep) 55%, transparent)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed left-1/2 top-1/2 z-50 w-[min(380px,92vw)] -translate-x-1/2 -translate-y-1/2">
                <Dialog.Title className="sr-only">
                  {isSignup ? "Create an account" : "Sign in"}
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Sign in to sync and share your maps.
                </Dialog.Description>
                <motion.form
                  onSubmit={submit}
                  initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.2, 0.7, 0.2, 1] }}
                  className="map-popover flex flex-col gap-3 rounded-2xl p-5"
                >
                  <h2 className="font-serif text-lg text-fg-1">
                    {isSignup ? "Create an account" : "Welcome back"}
                  </h2>

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
                    <p className="text-ui-hint font-medium text-danger" role="alert">
                      {error}
                    </p>
                  )}

                  <Button
                    kind="field"
                    accent
                    type="submit"
                    disabled={busy}
                    className="mt-1 h-10 justify-center rounded-md text-ui-control font-medium text-fg-on-color"
                  >
                    {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
                  </Button>

                  <button
                    type="button"
                    className="text-ui-hint text-fg-2 underline-offset-2 hover:underline"
                    onClick={() => {
                      setMode(isSignup ? "signin" : "signup");
                      setError(null);
                    }}
                  >
                    {isSignup ? "Already have an account? Sign in" : "No account yet? Create one"}
                  </button>
                </motion.form>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
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
      <span className="text-ui-caption font-semibold uppercase tracking-label-wide text-fg-3">
        {label}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md px-3 text-ui-control text-fg-1 outline-none"
        style={{
          background: "color-mix(in srgb, var(--surface) 80%, transparent)",
          boxShadow: "inset 0 0 0 1px var(--chrome-border)",
        }}
      />
    </label>
  );
}
