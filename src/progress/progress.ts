/**
 * Where the user is in their plan.
 *
 * Kept in `.viberaci/progress.json`, separate from the plan and gitignored.
 * The plan is what to build and does not change while you work through it;
 * progress is personal, changes constantly, and would otherwise turn every
 * finished step into a commit and every teammate into a merge conflict.
 *
 * Only completed step ids are stored. "Which step am I on" is derived from the
 * plan each time rather than saved, so a plan that gained a step does not leave
 * a stale pointer aimed at the wrong one.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import type { Plan, Step } from "../core/schema.js";
import { orderedSteps } from "../render/shared.js";

export const PROGRESS_PATH = ".viberaci/progress.json";
export const PLAN_PATH = ".viberaci/plan.json";

export const progressSchema = z.object({
  schemaVersion: z.literal(1),
  /**
   * The plan this progress belongs to. If the plan is regenerated, finished
   * steps from the old one must not be carried over as if they still counted.
   */
  planCreatedAt: z.string(),
  completed: z.array(z.string()).default([]),
  updatedAt: z.string(),
});

export type Progress = z.infer<typeof progressSchema>;

export function emptyProgress(plan: Plan, now = new Date()): Progress {
  return {
    schemaVersion: 1,
    planCreatedAt: plan.meta.createdAt,
    completed: [],
    updatedAt: now.toISOString(),
  };
}

export function loadProgress(projectDir: string, plan: Plan): Progress {
  const file = join(projectDir, PROGRESS_PATH);
  if (!existsSync(file)) return emptyProgress(plan);

  // A damaged or stale progress file is not worth an error the user cannot act
  // on. Losing a few ticks is recoverable; being unable to run the tool at all
  // is where a beginner gives up. Note this has to cover the JSON parse too --
  // a half-written file throws there, before any validation runs.
  let parsed;
  try {
    parsed = progressSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return emptyProgress(plan);
  }
  if (!parsed.success) return emptyProgress(plan);
  if (parsed.data.planCreatedAt !== plan.meta.createdAt) return emptyProgress(plan);

  // Drop ids that no longer exist, so an edited plan cannot leave phantom ticks.
  const known = new Set(plan.steps.map((s) => s.id));
  return { ...parsed.data, completed: parsed.data.completed.filter((id) => known.has(id)) };
}

export function saveProgress(projectDir: string, progress: Progress, now = new Date()): void {
  const file = join(projectDir, PROGRESS_PATH);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ ...progress, updatedAt: now.toISOString() }, null, 2)}\n`, "utf8");
}

export function loadPlanFile(projectDir: string): unknown {
  return JSON.parse(readFileSync(join(projectDir, PLAN_PATH), "utf8"));
}

export function isProjectDir(projectDir: string): boolean {
  return existsSync(join(projectDir, PLAN_PATH));
}

/** The step the user should do next, or undefined when the plan is finished. */
export function currentStep(plan: Plan, progress: Progress): Step | undefined {
  const done = new Set(progress.completed);
  return orderedSteps(plan).find((step) => !done.has(step.id));
}

export function isComplete(plan: Plan, progress: Progress): boolean {
  return currentStep(plan, progress) === undefined;
}

export function markDone(plan: Plan, progress: Progress, stepId: string): Progress {
  if (!plan.steps.some((s) => s.id === stepId)) {
    throw new Error(`no step called "${stepId}" in this plan`);
  }
  if (progress.completed.includes(stepId)) return progress;
  return { ...progress, completed: [...progress.completed, stepId] };
}

export function markUndone(progress: Progress, stepId: string): Progress {
  return { ...progress, completed: progress.completed.filter((id) => id !== stepId) };
}

export interface StepStatus {
  step: Step;
  state: "done" | "current" | "waiting";
  /** 1-based position in the order the user works through them. */
  number: number;
}

export function stepStatuses(plan: Plan, progress: Progress): StepStatus[] {
  const done = new Set(progress.completed);
  const current = currentStep(plan, progress);
  return orderedSteps(plan).map((step, i) => ({
    step,
    number: i + 1,
    state: done.has(step.id) ? "done" : step.id === current?.id ? "current" : "waiting",
  }));
}
