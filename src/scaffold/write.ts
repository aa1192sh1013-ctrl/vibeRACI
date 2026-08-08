/**
 * Putting a workspace on disk, carefully.
 *
 * The user this is built for cannot tell the difference between "the tool made
 * a folder" and "the tool ate my homework", and they will absolutely run this
 * in a directory that already has something in it. So the rules are:
 *
 *   - nothing is ever deleted
 *   - nothing is overwritten unless asked, by name, after being told
 *   - re-running with an unchanged plan is a no-op, not a rewrite
 *   - every path is proven to land inside the target before anything is opened
 *
 * All checks run before the first byte is written, so a refusal leaves the
 * directory exactly as it was.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import type { Plan } from "../core/schema.js";
import { planWorkspace } from "./plan-files.js";

export interface ScaffoldOptions {
  /** Work out everything and report it, but write nothing. */
  dryRun?: boolean;
  /** Replace files whose content differs. Off by default, on purpose. */
  overwrite?: boolean;
}

export interface ScaffoldReport {
  targetDir: string;
  dryRun: boolean;
  /** Files that did not exist and were created. */
  created: string[];
  /** Files that already existed with exactly this content. */
  unchanged: string[];
  /** Files that existed with different content and were replaced. */
  replaced: string[];
  /** Files that existed with different content and were left alone. */
  conflicts: string[];
  dirsCreated: string[];
}

export class ScaffoldConflictError extends Error {
  readonly conflicts: string[];

  constructor(conflicts: string[]) {
    super(
      `${conflicts.length} file(s) already exist with different content:\n` +
        conflicts.map((c) => `  ${c}`).join("\n") +
        "\n\nNothing was written. Re-run with overwrite to replace them.",
    );
    this.name = "ScaffoldConflictError";
    this.conflicts = conflicts;
  }
}

export function scaffoldProject(
  plan: Plan,
  targetDir: string,
  options: ScaffoldOptions = {},
): ScaffoldReport {
  const { dryRun = false, overwrite = false } = options;
  const root = resolve(targetDir);
  const workspace = planWorkspace(plan);

  const report: ScaffoldReport = {
    targetDir: root,
    dryRun,
    created: [],
    unchanged: [],
    replaced: [],
    conflicts: [],
    dirsCreated: [],
  };

  // --- decide everything first -------------------------------------------

  const writes: { absolute: string; relativePath: string; content: string }[] = [];

  for (const file of workspace.files) {
    const absolute = safeJoin(root, file.path);
    if (!existsSync(absolute)) {
      report.created.push(file.path);
      writes.push({ absolute, relativePath: file.path, content: file.content });
      continue;
    }
    if (readFileSync(absolute, "utf8") === file.content) {
      report.unchanged.push(file.path);
      continue;
    }
    if (overwrite) {
      report.replaced.push(file.path);
      writes.push({ absolute, relativePath: file.path, content: file.content });
    } else {
      report.conflicts.push(file.path);
    }
  }

  const dirsToCreate = workspace.dirs
    .map((d) => ({ relativePath: d, absolute: safeJoin(root, d) }))
    .filter((d) => !existsSync(d.absolute));
  report.dirsCreated = dirsToCreate.map((d) => d.relativePath);

  if (report.conflicts.length > 0) throw new ScaffoldConflictError(report.conflicts);
  if (dryRun) return report;

  // --- then write ---------------------------------------------------------

  mkdirSync(root, { recursive: true });
  for (const dir of dirsToCreate) mkdirSync(dir.absolute, { recursive: true });
  for (const write of writes) {
    mkdirSync(dirname(write.absolute), { recursive: true });
    writeFileSync(write.absolute, write.content, "utf8");
  }

  return report;
}

/**
 * Join and prove the result is still inside root.
 *
 * The schema already rejects `..` and absolute paths, but this is the last
 * gate before a real write, and a bug upstream should not become a file in
 * someone's home directory.
 */
function safeJoin(root: string, relativePath: string): string {
  const absolute = resolve(join(root, relativePath));
  const rel = relative(root, absolute);
  if (rel === "" || rel.startsWith("..") || rel.startsWith(`${sep}..`)) {
    throw new Error(`refusing to write outside the project folder: ${relativePath}`);
  }
  return absolute;
}
