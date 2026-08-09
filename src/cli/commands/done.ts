/**
 * `vibecrew done` -- tick the current step off and show the next one.
 *
 * Ticking off and showing what follows are one action, not two. The moment
 * after finishing something is exactly when a beginner needs to be told what
 * comes next, and making them run a second command to find out is how people
 * stall out and never come back.
 */
import { strings } from "../../core/strings.js";
import { currentStep, markDone, markUndone, saveProgress } from "../../progress/progress.js";
import { FriendlyError, type OpenedProject } from "../project.js";
import { dim, ok, say } from "../ui.js";
import { runNext } from "./next.js";

export function runDone(project: OpenedProject, stepId?: string): void {
  const { plan, progress, dir } = project;
  const s = strings(plan.meta.locale);

  const target = stepId ? plan.steps.find((x) => x.id === stepId) : currentStep(plan, progress);

  if (stepId && !target) {
    throw new FriendlyError(
      `There is no step called "${stepId}" in this plan.`,
      "Run  vibecrew status  to see the steps and their names.",
    );
  }
  if (!target) {
    say();
    ok(s.allDone);
    say();
    return;
  }

  const updated = markDone(plan, progress, target.id);
  saveProgress(dir, updated);

  say();
  ok(`${target.title} ${dim("- done")}`);

  runNext({ ...project, progress: updated });
}

/** `vibecrew undo` -- for the tick that was pressed a moment too early. */
export function runUndo(project: OpenedProject, stepId?: string): void {
  const { plan, progress, dir } = project;

  const lastDone = progress.completed.at(-1);
  const target = stepId ?? lastDone;

  if (!target) {
    throw new FriendlyError(
      "Nothing has been ticked off yet, so there is nothing to undo.",
      "Run  vibecrew next  to see what to do first.",
    );
  }

  const updated = markUndone(progress, target);
  saveProgress(dir, updated);

  const step = plan.steps.find((x) => x.id === target);
  say();
  ok(`${step?.title ?? target} ${dim("- put back on the list")}`);

  runNext({ ...project, progress: updated });
}
