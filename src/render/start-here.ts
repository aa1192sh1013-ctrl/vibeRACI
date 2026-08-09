/**
 * `START-HERE.md` — the runbook, and the first file the user opens.
 *
 * Everything else in the repository is for the agents. This one is for the
 * human, so it stays free of jargon and never asks them to understand
 * dependencies, phases, or ownership as concepts — it just tells them what to
 * do next, in order.
 */
import type { Plan } from "../core/schema.js";
import { strings, toolName } from "../core/strings.js";
import {
  bullets,
  checkboxes,
  numbered,
  orderedSteps,
  promptPath,
  roleById,
  section,
  stepEmoji,
  stepsByPhase,
} from "./shared.js";

export function renderStartHere(plan: Plan): string {
  const s = strings(plan.meta.locale);

  const team = plan.roles.map((r) => `**${r.emoji} ${r.displayName}** — ${r.summary}`);

  const overview = stepsByPhase(plan).map(({ phase, steps }) => {
    const names = steps.map((st) => `${stepEmoji(plan, st)} ${st.title}`).join("  ·  ");
    const note = steps.length > 1 ? `\n  ${s.independentNote}` : "";
    return `${s.phaseLabel(phase)} — ${names}${note}`;
  });

  const detail = orderedSteps(plan).map((step, i) => {
    const heading = `### ${s.stepHeading(i + 1, `${stepEmoji(plan, step)} ${step.title}`)}`;

    // A human step is the user's own turn: no tool to open, nothing to paste,
    // just the thing to try and what should happen.
    if (step.kind === "human" || !step.roleId) {
      return section(
        heading,
        step.goal,
        `_${s.yourTurn}_`,
        numbered(step.tasks),
        `**${s.doneWhen}**\n\n${checkboxes(step.doneWhen)}`,
        s.whenFinishedHuman,
      );
    }

    const role = roleById(plan, step.roleId);
    return section(
      heading,
      step.goal,
      `1. ${s.howToRun(toolName(role.tool))}\n2. ${s.copyPromptFrom(`\`${promptPath(step)}\``)}`,
      `**${s.doneWhen}**\n\n${checkboxes(step.doneWhen)}`,
      s.whenFinished,
    );
  });

  return section(
    `# ${s.runbookTitle(plan.meta.projectName)}`,
    `> ${plan.meta.idea}`,
    s.runbookIntro,
    `## ${s.teamHeading}\n\n${bullets(team)}`,
    `## ${s.planHeading}\n\n${bullets(overview)}`,
    "---",
    detail.join("\n"),
    "---",
    s.allDone,
    `_${s.generatedBy}_`,
  );
}
