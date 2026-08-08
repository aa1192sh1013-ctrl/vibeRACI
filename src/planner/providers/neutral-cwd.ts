/**
 * A scratch directory to run CLI agents from.
 *
 * Both CLIs pick up project context from wherever they are launched. Running
 * the planner inside the user's project would drag CLAUDE.md and the rest of
 * the repository into a call that only needs to answer one question -- the M0
 * spike measured twenty thousand cached tokens of it -- and would let a
 * half-built project bias the plan for the project it is meant to describe.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function withNeutralCwd<T>(run: (cwd: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "viberaci-plan-"));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
