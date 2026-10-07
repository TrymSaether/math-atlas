/** The command contract every file in commands/ implements. */
import type { Ctx } from "./context";

export interface Command {
  name: string;
  summary: string;
  /** Grouping bucket for the help index. */
  group: "Inspect" | "Graph" | "Build" | "Author" | "Quality";
  usage?: string;
  /** Extra help lines printed under `atlas <name> --help`. */
  help?: string[];
  /** Returns a process exit code. */
  run(ctx: Ctx): number | Promise<number>;
}
