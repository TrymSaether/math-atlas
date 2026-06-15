#!/usr/bin/env node
/**
 * `atlas` launcher. Runs the TypeScript CLI through the repo's local tsx so the
 * tool works via `npx atlas`, an npm-linked `atlas`, or a direct invocation —
 * with zero build step. Argv is forwarded verbatim and the child's exit code is
 * propagated.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url)); // scripts/atlas
const cli = join(here, "cli.ts");
const repoRoot = join(here, "..", "..");
const tsxBin = join(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);

const runner = existsSync(tsxBin) ? { cmd: tsxBin, pre: [] } : { cmd: "npx", pre: ["tsx"] }; // fallback if deps not installed locally

const child = spawn(runner.cmd, [...runner.pre, cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
child.on("error", (err) => {
  process.stderr.write(`atlas: failed to launch tsx — ${err.message}\n`);
  process.exit(1);
});
