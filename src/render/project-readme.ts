/**
 * `README.md` for the generated project.
 *
 * Deliberately thin. The user's attention belongs in `START-HERE.md`, so this
 * file's main job is to point there rather than to compete with it.
 */
import type { Plan } from "../core/schema.js";
import { strings } from "../core/strings.js";
import { bullets, section } from "./shared.js";

export function renderProjectReadme(plan: Plan): string {
  const s = strings(plan.meta.locale);

  const team = plan.roles.map((r) => `${r.emoji} **${r.displayName}** — ${r.summary}`);

  return section(
    `# ${plan.meta.projectName}`,
    `> ${plan.meta.idea}`,
    `**${s.planHeading} → [START-HERE.md](START-HERE.md)**`,
    `## ${s.teamHeading}\n\n${bullets(team)}`,
    `## Stack\n\n${plan.stack.name} — ${plan.stack.why}`,
    `---\n\n_${s.generatedBy}_`,
  );
}
