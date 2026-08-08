/**
 * `.agents/settings/<role>.settings.json` — optional hard enforcement for
 * Claude Code.
 *
 * Charters and prompts are *requests*: an agent can ignore them. Claude Code
 * also accepts a session-scoped settings file whose `deny` rules outrank
 * project settings and merge such that the restrictive value wins, so an agent
 * cannot unlock itself:
 *
 *     claude --settings .agents/settings/frontend.settings.json
 *
 * IMPORTANT: this is generated as a bonus, never depended on. The M0 spike
 * could not verify it end to end, and Codex's equivalent sandbox was outright
 * broken on the test machine. vibeRACI must keep working correctly when this
 * file does nothing at all, and must never tell the user they are protected.
 */
import type { Plan, Role } from "../core/schema.js";
import { pathsOwnedByOthers, rulesFor } from "./shared.js";

export function renderAgentSettings(plan: Plan, role: Role): string {
  // Blocked outright: the agent may not even look. Reserved for explicit
  // `denied` rules, which exist for genuinely dangerous ground like migrations.
  const blind = rulesFor(plan, role.id, "denied").map((r) => r.glob);

  // Look but do not touch. Owning a path is not a reason to hide it from the
  // rest of the team -- the UI has to read the API contract to call it
  // correctly, and an agent that cannot read its neighbours guesses instead.
  const readOnly = [
    ...rulesFor(plan, role.id, "reads").map((r) => r.glob),
    ...pathsOwnedByOthers(plan, role.id).map((r) => r.glob),
  ].filter((g) => !blind.includes(g));

  const deny = [
    ...new Set([
      ...blind.flatMap((g) => [`Edit(${g})`, `Write(${g})`, `Read(${g})`]),
      ...readOnly.flatMap((g) => [`Edit(${g})`, `Write(${g})`]),
    ]),
  ];

  return `${JSON.stringify({ permissions: { deny } }, null, 2)}\n`;
}
