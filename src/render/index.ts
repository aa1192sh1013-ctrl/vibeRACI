/**
 * Plan in, files out. Pure: no disk, no network, no clock.
 *
 * Keeping this a pure function is what makes the product testable — the whole
 * output is a value you can snapshot and diff. Writing to disk is a separate
 * concern (M2), and deciding *what* goes in the plan is another (M3).
 */
import type { Plan } from "../core/schema.js";
import { renderAgentCharter } from "./agent-charter.js";
import { renderAgentSettings } from "./agent-settings.js";
import { renderOwnership } from "./ownership.js";
import { renderPrompt } from "./prompts.js";
import { renderAgentsMd, renderClaudeMd } from "./project-docs.js";
import { renderStartHere } from "./start-here.js";
import {
  type RenderedFile,
  charterPath,
  orderedSteps,
  promptPath,
  settingsPath,
} from "./shared.js";

export type { RenderedFile } from "./shared.js";

export function renderAll(plan: Plan): RenderedFile[] {
  const files: RenderedFile[] = [
    { path: "START-HERE.md", content: renderStartHere(plan) },
    { path: ".agents/ownership.json", content: renderOwnership(plan) },
  ];

  // Only emit an instructions file for tools this project actually uses;
  // a stray AGENTS.md in a Claude-only project is just confusing.
  const tools = new Set(plan.roles.map((r) => r.tool));
  if (tools.has("claude-code")) {
    files.push({ path: "CLAUDE.md", content: renderClaudeMd(plan) });
  }
  if (tools.has("codex")) {
    files.push({ path: "AGENTS.md", content: renderAgentsMd(plan) });
  }

  for (const role of plan.roles) {
    files.push({ path: charterPath(role), content: renderAgentCharter(plan, role) });
    if (role.tool === "claude-code") {
      files.push({ path: settingsPath(role), content: renderAgentSettings(plan, role) });
    }
  }

  // Only agent steps get a prompt. A human step has nothing to paste anywhere,
  // and writing one would invite the user to hand it to an agent that cannot
  // do it -- the exact failure this distinction exists to prevent.
  for (const step of orderedSteps(plan)) {
    if (step.kind !== "agent") continue;
    files.push({ path: promptPath(step), content: renderPrompt(plan, step) });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}
