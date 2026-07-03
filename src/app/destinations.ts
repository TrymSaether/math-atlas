import { BookOpen, Compass, Route, Variable, WalletCards, type LucideIcon } from "lucide-react";
import type { AtlasMode, Surface } from "./store";

export interface ShellDestinationState {
  surface: Surface;
  mode: AtlasMode;
}

export interface ShellDestinationActions {
  setSurface: (surface: Surface) => void;
  setMode: (mode: AtlasMode) => void;
}

export interface ShellDestination {
  id: "atlas" | "paths" | "dictionary" | "flashcards" | "sandbox";
  label: string;
  description: string;
  icon: LucideIcon;
  section: "library" | "tools";
  isActive: (state: ShellDestinationState) => boolean;
  activate: (actions: ShellDestinationActions) => void;
}

export const SHELL_DESTINATIONS: readonly ShellDestination[] = [
  {
    id: "atlas",
    label: "Atlas",
    description: "Explore the concept map",
    icon: Compass,
    section: "library",
    isActive: ({ surface, mode }) => surface === "atlas" && mode === "explore",
    activate: ({ setSurface, setMode }) => {
      setSurface("atlas");
      setMode("explore");
    },
  },
  {
    id: "paths",
    label: "Paths",
    description: "Plan a guided study route",
    icon: Route,
    section: "library",
    isActive: ({ surface, mode }) => surface === "atlas" && mode === "paths",
    activate: ({ setSurface, setMode }) => {
      setSurface("atlas");
      setMode("paths");
    },
  },
  {
    id: "dictionary",
    label: "Index",
    description: "Browse concepts and collections",
    icon: BookOpen,
    section: "library",
    isActive: ({ surface }) => surface === "dictionary",
    activate: ({ setSurface }) => setSurface("dictionary"),
  },
  {
    id: "flashcards",
    label: "Study",
    description: "Review saved concepts",
    icon: WalletCards,
    section: "library",
    isActive: ({ surface }) => surface === "flashcards",
    activate: ({ setSurface }) => setSurface("flashcards"),
  },
  {
    id: "sandbox",
    label: "Sandbox",
    description: "Experiment with expressions",
    icon: Variable,
    section: "tools",
    isActive: ({ surface }) => surface === "sandbox",
    activate: ({ setSurface }) => setSurface("sandbox"),
  },
] as const;

export const LIBRARY_DESTINATIONS = SHELL_DESTINATIONS.filter((destination) => destination.section === "library");
export const TOOL_DESTINATIONS = SHELL_DESTINATIONS.filter((destination) => destination.section === "tools");
