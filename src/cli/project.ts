/**
 * Opening a vibeRACI project from disk.
 *
 * Every failure here is one a beginner will hit, so each carries the thing to
 * do about it rather than the exception that caused it. "No such file
 * .viberaci/plan.json" is true and useless; "you are not in a project folder,
 * here is how to make one" is what they need.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { type Plan, parsePlan } from "../core/schema.js";
import { PLAN_PATH, type Progress, isProjectDir, loadProgress } from "../progress/progress.js";

export class FriendlyError extends Error {
  readonly hint?: string;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = "FriendlyError";
    this.hint = hint;
  }
}

export interface OpenedProject {
  dir: string;
  plan: Plan;
  progress: Progress;
}

export function openProject(dir = process.cwd()): OpenedProject {
  const root = resolve(dir);

  if (!isProjectDir(root)) {
    throw new FriendlyError(
      "This folder is not a vibeRACI project yet.",
      'Make one here with:  viberaci init "what you want to build"',
    );
  }

  let plan: Plan;
  try {
    plan = parsePlan(JSON.parse(readFileSync(resolve(root, PLAN_PATH), "utf8")));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new FriendlyError(
        `${PLAN_PATH} has something wrong with it:\n${error.issues
          .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
          .join("\n")}`,
        "If you edited it by hand, undo that change. Otherwise run viberaci init again in a new folder.",
      );
    }
    throw new FriendlyError(
      `Could not read ${PLAN_PATH}.`,
      "The file may be damaged. Run viberaci init again in a new folder.",
    );
  }

  return { dir: root, plan, progress: loadProgress(root, plan) };
}
