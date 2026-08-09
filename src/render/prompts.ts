/**
 * `.agents/prompts/<step>.md` — the thing the user actually copies and pastes.
 *
 * This is the product's real output. Everything else is supporting material,
 * so this file gets the most care: it must stand completely on its own,
 * because the agent receiving it has no memory of vibecrew and no idea what
 * a "plan" is.
 */
import type { Plan, Step } from "../core/schema.js";
import { strings } from "../core/strings.js";
import { bullets, charterPath, mustNotModify, numbered, roleById, rulesFor, section } from "./shared.js";

export function renderPrompt(plan: Plan, step: Step): string {
  if (step.kind !== "agent" || !step.roleId) {
    throw new Error(`step "${step.id}" is the user's own work and has no prompt`);
  }
  const s = strings(plan.meta.locale);
  const role = roleById(plan, step.roleId);

  const owns = rulesFor(plan, role.id, "owns").map((r) => `\`${r.glob}\``);
  const reads = rulesFor(plan, role.id, "reads").map((r) => `\`${r.glob}\``);
  const shared = rulesFor(plan, role.id, "shared").map(
    (r) => `\`${r.glob}\` — ${r.note ?? ""}`.trimEnd(),
  );
  const offLimits = mustNotModify(plan, role.id).map((r) =>
    r.mode === "owns" ? `\`${r.glob}\` — ${roleById(plan, r.roleId).displayName}` : `\`${r.glob}\``,
  );

  const handoffNames = step.handoffTo.map((id) => {
    const other = roleById(plan, id);
    return `${other.emoji} ${other.displayName}`;
  });

  return section(
    `${s.youAre}: **${role.emoji} ${role.displayName}** — ${plan.meta.projectName}`,
    `> ${role.summary}`,
    `## ${s.yourJob}\n\n${step.goal}\n\n${numbered(step.tasks)}`,
    owns.length > 0 && `## ${s.ownedPaths}\n\n${bullets(owns)}`,
    // The prompt is the only thing the agent receives, so "where to look for
    // context" has to be in here -- not only in the charter it may never open.
    reads.length > 0 && `## ${s.readOnlyPaths}\n\n${bullets(reads)}`,
    shared.length > 0 && `## ${s.sharedPaths}\n\n${bullets(shared)}`,
    offLimits.length > 0 && `## ${s.mustNotModify}\n\n${bullets(offLimits)}\n\n${s.outOfScopeRule}`,
    `## ${s.doneWhen}\n\n${checklist(step.doneWhen)}`,
    handoffNames.length > 0 && `## ${s.handoffHeading}\n\n${s.handoffRule(handoffNames.join(", "))}`,
    `---\n\n${s.humanIsOwner}\n\n_${charterPath(role)}_`,
  );
}

function checklist(items: string[]): string {
  return items.map((i) => `- [ ] ${i}`).join("\n");
}
