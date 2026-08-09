/**
 * `vibecrew status` -- where am I?
 *
 * The whole list, with one line each and a clear marker for where the user is.
 * A beginner who has been away for a week should be able to read this and know
 * what to do without opening anything else.
 */
import { strings } from "../../core/strings.js";
import { stepEmoji } from "../../render/shared.js";
import { isComplete, stepStatuses } from "../../progress/progress.js";
import type { OpenedProject } from "../project.js";
import { bold, dim, green, heading, ok, say } from "../ui.js";

export function runStatus({ plan, progress }: OpenedProject): void {
  const s = strings(plan.meta.locale);

  heading(plan.meta.projectName);
  say(dim(plan.meta.idea));

  say();
  say(bold(s.teamHeading));
  for (const role of plan.roles) {
    say(`  ${role.emoji} ${role.displayName} ${dim(`- ${role.summary}`)}`);
  }

  say();
  say(bold(s.planHeading));
  for (const { step, state, number } of stepStatuses(plan, progress)) {
    const label = `${stepEmoji(plan, step)} ${step.title}`;
    if (state === "done") say(`  ${green("[x]")} ${dim(`${number}. ${label}`)}`);
    else if (state === "current") say(`  ${bold("->")}  ${bold(`${number}. ${label}`)}`);
    else say(`  ${dim("[ ]")} ${number}. ${label}`);
  }

  say();
  if (isComplete(plan, progress)) ok(s.allDone);
  else say(`  ${dim(s.whatToDoNow)}  ${bold("vibecrew next")}`);
  say();
}
