/**
 * atlas — the Math Atlas developer CLI.
 *
 * A small, dependency-free command framework: parse argv into a command +
 * positionals + flags, dispatch to a registered Command, and render either rich
 * terminal output or `--json`. Validation, graph, build, authoring and quality
 * tooling all hang off the same load path (core/context.ts → CliMap).
 */
import { createContext, CliError, type FlagValue } from "./core/context";
import type { Command } from "./core/command";
import { setColor, bold, dim, cyan, red } from "./utils/color";
import { MARK } from "./utils/glyphs";

import validateCmd from "./commands/validate";
import statsCmd from "./commands/stats";
import findCmd from "./commands/find";
import explainCmd from "./commands/explain";
import graphCmd from "./commands/graph";
import buildCmd from "./commands/build";
import doctorCmd from "./commands/doctor";
import coverageCmd from "./commands/coverage";
import newCmd from "./commands/new";
import formatCmd from "./commands/format";
import latexCmd from "./commands/latex";
import diagramCmd from "./commands/diagram";
import routeCmd from "./commands/route";

const COMMANDS: Command[] = [
  validateCmd,
  statsCmd,
  findCmd,
  explainCmd,
  graphCmd,
  routeCmd,
  buildCmd,
  doctorCmd,
  coverageCmd,
  newCmd,
  formatCmd,
  latexCmd,
  diagramCmd,
];

const REGISTRY = new Map(COMMANDS.map((c) => [c.name, c]));

/** Flags that consume the following token as their value. */
const VALUE_FLAGS = new Set([
  "map",
  "m",
  "by",
  "from",
  "to",
  "difficulty",
  "out",
  "limit",
  "depth",
  "label",
  "domain",
  "palette",
]);
const SHORT: Record<string, string> = {
  m: "map",
  q: "quiet",
  v: "verbose",
  h: "help",
};

interface Parsed {
  command?: string;
  positionals: string[];
  flags: Record<string, FlagValue>;
}

function parseArgs(argv: string[]): Parsed {
  const positionals: string[] = [];
  const flags: Record<string, FlagValue> = {};
  let command: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith("--")) {
      const body = tok.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else if (VALUE_FLAGS.has(body) && i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        flags[body] = argv[++i];
      } else {
        flags[body] = true;
      }
    } else if (tok.startsWith("-") && tok.length > 1) {
      const short = tok.slice(1);
      const long = SHORT[short] ?? short;
      if (VALUE_FLAGS.has(long) && i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        flags[long] = argv[++i];
      } else {
        flags[long] = true;
      }
    } else if (command === undefined) {
      command = tok;
    } else {
      positionals.push(tok);
    }
  }
  return { command, positionals, flags };
}

function banner(): void {
  process.stdout.write("\n" + bold(cyan("  atlas")) + dim("  ·  Math Atlas developer CLI") + "\n");
}

function printHelp(): void {
  banner();
  process.stdout.write(
    "\n  " + dim("usage:") + " atlas " + cyan("<command>") + " [args] [--flags]\n",
  );

  const groups = new Map<string, Command[]>();
  for (const c of COMMANDS) {
    (groups.get(c.group) ?? groups.set(c.group, []).get(c.group)!).push(c);
  }
  const order = ["Inspect", "Graph", "Build", "Author", "Quality"];
  for (const g of order) {
    const cmds = groups.get(g);
    if (!cmds) continue;
    process.stdout.write("\n  " + bold(g) + "\n");
    for (const c of cmds) {
      process.stdout.write("    " + cyan(c.name.padEnd(12)) + dim(c.summary) + "\n");
    }
  }
  process.stdout.write(
    "\n  " +
      bold("Global flags") +
      "\n" +
      "    " +
      cyan("--map <id>".padEnd(14)) +
      dim("scope to one map (default: all)") +
      "\n" +
      "    " +
      cyan("--json".padEnd(14)) +
      dim("machine-readable output") +
      "\n" +
      "    " +
      cyan("--no-color".padEnd(14)) +
      dim("disable colour") +
      "\n" +
      "    " +
      cyan("-v, --verbose".padEnd(14)) +
      dim("more detail") +
      "\n" +
      "    " +
      cyan("-q, --quiet".padEnd(14)) +
      dim("less detail") +
      "\n",
  );
  process.stdout.write(
    "\n  " +
      dim("run") +
      " atlas " +
      cyan("<command> --help") +
      dim(" for command detail") +
      "\n\n",
  );
}

function printCommandHelp(cmd: Command): void {
  banner();
  process.stdout.write("\n  " + bold(cmd.name) + dim("  —  " + cmd.summary) + "\n");
  if (cmd.usage) {
    process.stdout.write("\n  " + dim("usage:") + " " + cmd.usage + "\n");
  }
  if (cmd.help?.length) {
    process.stdout.write("\n" + cmd.help.map((l) => "  " + l).join("\n") + "\n");
  }
  process.stdout.write("\n");
}

function suggest(name: string): string | undefined {
  let best: string | undefined;
  let bestScore = Infinity;
  for (const c of REGISTRY.keys()) {
    const d = levenshtein(name, c);
    if (d < bestScore) {
      bestScore = d;
      best = c;
    }
  }
  return bestScore <= 3 ? best : undefined;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}

async function main(): Promise<number> {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));

  if (flags.json === true || flags["no-color"] === true) setColor(false);

  if (!command || command === "help") {
    printHelp();
    return 0;
  }

  const cmd = REGISTRY.get(command);
  if (!cmd) {
    process.stderr.write(red(`${MARK.error} unknown command '${command}'`) + "\n");
    const guess = suggest(command);
    if (guess) process.stderr.write(dim(`  did you mean `) + cyan(guess) + dim("?") + "\n");
    process.stderr.write(dim("  run `atlas help` for the command list") + "\n");
    return 1;
  }

  if (flags.help === true) {
    printCommandHelp(cmd);
    return 0;
  }

  const ctx = createContext(positionals, flags);
  try {
    return await cmd.run(ctx);
  } catch (err) {
    if (err instanceof CliError) {
      process.stderr.write("\n" + red(`${MARK.error} ${err.message}`) + "\n");
      if (err.hint) process.stderr.write(dim(`  hint: ${err.hint}`) + "\n");
      return 1;
    }
    throw err;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(red("\nunexpected error:\n") + String(err?.stack ?? err) + "\n");
    process.exit(1);
  },
);
