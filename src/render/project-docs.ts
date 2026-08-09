/**
 * `CLAUDE.md` and `AGENTS.md` — the shared brief every agent reads regardless
 * of which role it is playing.
 *
 * Both tools read a project-level instructions file; the content is nearly
 * identical, so it is rendered once and headed differently. This file answers
 * "what is this project and who else is working on it", while
 * `.agents/<role>.md` answers "what am I allowed to do".
 */
import type { Plan } from "../core/schema.js";
import { strings, toolName } from "../core/strings.js";
import { HEADER_MARK, bullets, charterPath, section, stepEmoji, stepsByPhase } from "./shared.js";

function body(plan: Plan): string {
  const s = strings(plan.meta.locale);

  const team = plan.roles.map((r) => {
    const owns = plan.ownership
      .filter((o) => o.mode === "owns" && o.roleId === r.id)
      .map((o) => `\`${o.glob}\``)
      .join(", ");
    const scope = owns.length > 0 ? ` — ${owns}` : "";
    return `**${r.emoji} ${r.displayName}** (${toolName(r.tool)}) — ${r.summary}${scope}\n  → ${charterPath(r)}`;
  });

  const order = stepsByPhase(plan).map(({ phase, steps }) => {
    const names = steps.map((st) => `${stepEmoji(plan, st)} ${st.title}`);
    const note = steps.length > 1 ? `\n  ${s.independentNote}` : "";
    return `${s.phaseLabel(phase)}: ${names.join(" · ")}${note}`;
  });

  const shared = plan.ownership
    .filter((o) => o.mode === "shared")
    .map((o) => `\`${o.glob}\` — ${o.note ?? ""}`.trimEnd());

  return section(
    `# ${plan.meta.projectName}`,
    `> ${plan.meta.idea}`,
    `**Stack:** ${plan.stack.name} — ${plan.stack.why}`,
    `## ${s.teamHeading}\n\n${team.join("\n\n")}`,
    `## ${s.planHeading}\n\n${bullets(order)}`,
    shared.length > 0 && `## ${s.sharedPaths}\n\n${bullets(shared)}`,
    `## ${s.mustNotModify}\n\n${s.outOfScopeRule}`,
    `---\n\n${s.humanIsOwner}`,
    `_${s.generatedBy}. ${s.doNotEditByHand}_`,
  );
}

export function renderClaudeMd(plan: Plan): string {
  const s = strings(plan.meta.locale);
  return section(HEADER_MARK, `<!-- ${s.claudeMdIntro} -->`, body(plan));
}

export function renderAgentsMd(plan: Plan): string {
  const s = strings(plan.meta.locale);
  return section(HEADER_MARK, `<!-- ${s.agentsMdIntro} -->`, body(plan));
}
