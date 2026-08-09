/**
 * `.agents/ownership.json` — the machine-readable ownership map.
 *
 * Chosen over the YAML the original sketch suggested: JSON needs no extra
 * dependency and no hand-rolled escaping, and this file is read by tools, not
 * by beginners. Humans get `CLAUDE.md` and the charters instead.
 */
import type { Plan } from "../core/schema.js";

interface RoleOwnership {
  displayName: string;
  tool: string;
  owns: string[];
  reads: string[];
  shared: { glob: string; note: string }[];
  denied: string[];
}

export function renderOwnership(plan: Plan): string {
  const agents: Record<string, RoleOwnership> = {};

  for (const role of plan.roles) {
    const mine = plan.ownership.filter((o) => o.roleId === role.id);
    agents[role.id] = {
      displayName: role.displayName,
      tool: role.tool,
      owns: mine.filter((o) => o.mode === "owns").map((o) => o.glob),
      reads: mine.filter((o) => o.mode === "reads").map((o) => o.glob),
      shared: mine
        .filter((o) => o.mode === "shared")
        .map((o) => ({ glob: o.glob, note: o.note ?? "" })),
      denied: mine.filter((o) => o.mode === "denied").map((o) => o.glob),
    };
  }

  return `${JSON.stringify(
    { schemaVersion: plan.schemaVersion, generatedBy: "vibecrew", agents },
    null,
    2,
  )}\n`;
}
