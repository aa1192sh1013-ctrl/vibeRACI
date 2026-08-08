/**
 * `.agents/<role>.md` — one role's standing brief.
 *
 * This is the file a coding agent reads to know what it is and where its
 * boundaries are. It is written in plain language on purpose: no RACI, no
 * "authority scope", no "context isolation". The internal model is
 * sophisticated; the words the agent and the user read are not.
 */
import type { Plan, Role } from "../core/schema.js";
import { strings, toolName } from "../core/strings.js";
import {
  HEADER_MARK,
  bullets,
  mustNotModify,
  roleById,
  rulesFor,
  section,
  stepsForRole,
} from "./shared.js";

export function renderAgentCharter(plan: Plan, role: Role): string {
  const s = strings(plan.meta.locale);

  const owns = rulesFor(plan, role.id, "owns").map((r) => `\`${r.glob}\``);
  const reads = rulesFor(plan, role.id, "reads").map((r) => `\`${r.glob}\``);
  const shared = rulesFor(plan, role.id, "shared").map(
    (r) => `\`${r.glob}\` — ${r.note ?? ""}`.trimEnd(),
  );

  // Explicit denials, plus everything another role owns that is not already
  // covered by the read-only list above.
  const denied = mustNotModify(plan, role.id).map((r) =>
    r.mode === "owns" ? `\`${r.glob}\` — ${roleById(plan, r.roleId).displayName}` : `\`${r.glob}\``,
  );

  const consultNames = role.consults.map((id) => {
    const other = roleById(plan, id);
    return `${other.emoji} ${other.displayName}`;
  });

  const steps = stepsForRole(plan, role.id);

  return section(
    HEADER_MARK,
    `# ${role.emoji} ${role.displayName}`,
    `> ${role.summary}`,
    `**${s.youAre}:** ${role.emoji} ${role.displayName} — ${toolName(role.tool)}`,
    `## ${s.primaryResponsibility}\n\n${bullets(role.responsibilities)}`,
    owns.length > 0 && `## ${s.ownedPaths}\n\n${bullets(owns)}`,
    reads.length > 0 && `## ${s.readOnlyPaths}\n\n${bullets(reads)}`,
    shared.length > 0 && `## ${s.sharedPaths}\n\n${bullets(shared)}`,
    denied.length > 0 && `## ${s.mustNotModify}\n\n${bullets(denied)}`,
    `## ${s.needSomethingElse}\n\n${s.outOfScopeRule}`,
    consultNames.length > 0 && `## ${s.handoffHeading}\n\n${s.handoffRule(consultNames.join(", "))}`,
    steps.length > 0 &&
      `## ${s.yourJob}\n\n${bullets(steps.map((st) => `**${st.title}** — ${st.goal}`))}`,
    `---\n\n${s.humanIsOwner}`,
  );
}
