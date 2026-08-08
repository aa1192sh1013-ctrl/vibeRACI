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
  orderedSteps,
  promptPath,
  roleById,
  section,
  stepsByPhase,
} from "./shared.js";

export function renderStartHere(plan: Plan): string {
  const s = strings(plan.meta.locale);

  const team = plan.roles.map((r) => `**${r.emoji} ${r.displayName}** — ${r.summary}`);

  const overview = stepsByPhase(plan).map(({ phase, steps }) => {
    const names = steps
      .map((st) => {
        const role = roleById(plan, st.roleId);
        return `${role.emoji} ${st.title}`;
      })
      .join("  ·  ");
    const note = steps.length > 1 ? `\n  ${s.independentNote}` : "";
    return `${s.phaseLabel(phase)} — ${names}${note}`;
  });

  const detail = orderedSteps(plan).map((step, i) => {
    const role = roleById(plan, step.roleId);
    return section(
      `### ${s.stepHeading(i + 1, `${role.emoji} ${step.title}`)}`,
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
