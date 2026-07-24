import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface ShellAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  pressed?: boolean;
  status?: boolean;
}

interface RegisteredShellActions {
  surface: string;
  actions: readonly ShellAction[];
}

const EMPTY_ACTIONS: RegisteredShellActions = { surface: "", actions: [] };
const ShellActionsContext = createContext<RegisteredShellActions>(EMPTY_ACTIONS);
const ShellActionRegisterContext = createContext<
  ((surface: string, actions: readonly ShellAction[]) => () => void) | null
>(null);

export function ShellActionsProvider({ children }: { children: ReactNode }) {
  const [registrationState, setRegistrationState] = useState<RegisteredShellActions>(EMPTY_ACTIONS);
  const registrationRef = useRef<symbol | null>(null);

  const register = useCallback((surface: string, nextActions: readonly ShellAction[]) => {
    const registration = Symbol("shell-actions");
    registrationRef.current = registration;
    setRegistrationState({ surface, actions: nextActions });
    return () => {
      if (registrationRef.current !== registration) return;
      registrationRef.current = null;
      setRegistrationState(EMPTY_ACTIONS);
    };
  }, []);

  return (
    <ShellActionRegisterContext.Provider value={register}>
      <ShellActionsContext.Provider value={registrationState}>{children}</ShellActionsContext.Provider>
    </ShellActionRegisterContext.Provider>
  );
}

export function useShellActions(activeSurface: string): readonly ShellAction[] {
  const registration = useContext(ShellActionsContext);
  return registration.surface === activeSurface ? registration.actions : [];
}

/** Register a stable, memoized action array while a product surface is mounted. */
export function useRegisterShellActions(surface: string, actions: readonly ShellAction[]) {
  const register = useContext(ShellActionRegisterContext);

  useEffect(() => {
    if (!register) return;
    return register(surface, actions);
  }, [actions, register, surface]);
}
