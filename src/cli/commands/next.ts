/**
 * `vibesquad next` -- what do I do right now?
 *
 * The most important screen in the product. It shows exactly one step and
 * exactly one thing to do about it. Everything else the user might want --
 * the full list, the prompt text, the next command -- is one keystroke away
 * and deliberately not on this screen.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strings, toolName } from "../../core/strings.js";
import { orderedSteps, promptPath, roleById, stepEmoji } from "../../render/shared.js";
import { currentStep, isComplete } from "../../progress/progress.js";
import { copyToClipboard } from "../clipboard.js";
import type { OpenedProject } from "../project.js";
import { bold, checkbox, cyan, dim, heading, numberedLine, ok, say, warn } from "../ui.js";

export interface NextOptions {
  /** Print the whole prompt to the terminal instead of pointing at the file. */
  show?: boolean;
  /** Put the prompt on the clipboard. */
  copy?: boolean;
}

export function runNext(project: OpenedProject, options: NextOptions = {}): void {
  const { plan, progress, dir } = project;
  const s = strings(plan.meta.locale);

  if (isComplete(plan, progress)) {
    say();
    ok(s.allDone);
    say(dim("  vibesquad status  shows everything you did."));
    say();
    return;
  }

  const step = currentStep(plan, progress);
  if (!step) return;

  const position = orderedSteps(plan).findIndex((x) => x.id === step.id) + 1;
  const total = plan.steps.length;

  heading(`${position}/${total}  ${stepEmoji(plan, step)} ${step.title}`);
  say(step.goal);
  say();

  if (step.kind === "human" || !step.roleId) {
    say(dim(s.yourTurn));
    say();
    step.tasks.forEach((task, i) => numberedLine(i + 1, task));
  } else {
    const role = roleById(plan, step.roleId);
    const prompt = join(dir, promptPath(step));

    numberedLine(1, s.howToRun(toolName(role.tool)));
    if (options.show) {
      numberedLine(2, s.copyBetweenLines);
      say();
      say(dim("-".repeat(60)));
      say(readFileSync(prompt, "utf8").trimEnd());
      say(dim("-".repeat(60)));
    } else if (options.copy) {
      if (copyToClipboard(readFileSync(prompt, "utf8"))) {
        numberedLine(2, s.alreadyOnClipboard);
      } else {
        numberedLine(2, s.copyPromptFrom(promptPath(step)));
        warn(s.clipboardUnavailable);
      }
    } else {
      numberedLine(2, s.copyPromptFrom(promptPath(step)));
      say(`     ${dim(s.orCopyToClipboard(cyan("vibesquad next --copy")))}`);
    }
  }

  say();
  say(bold(s.doneWhen));
  for (const check of step.doneWhen) checkbox(check);

  say();
  say(dim(step.kind === "human" ? s.whenFinishedHuman : s.whenFinished));
  say(`  ${dim(s.thenRun)}  ${cyan("vibesquad done")}`);
  say();
}
