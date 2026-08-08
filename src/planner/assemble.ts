/**
 * Turning what the model wrote into a validated Plan.
 *
 * Everything mechanical happens here rather than in the prompt: emoji from the
 * archetype, metadata from the user's own answers, and the folder layout
 * derived from the ownership map. The result goes through the full plan schema,
 * so a model that produced a contradiction fails here rather than three steps
 * later in someone's project folder.
 */
import { archetype } from "../core/archetypes.js";
import { type OwnershipRule, type Plan, type ScaffoldEntry, parsePlan } from "../core/schema.js";
import type { Answers } from "./answers.js";
import type { PlannerOutput } from "./output-schema.js";

export function assemblePlan(
  answers: Answers,
  output: PlannerOutput,
  now: Date = new Date(),
): Plan {
  const roles = output.roles.map((role) => ({
    ...role,
    emoji: archetype(role.archetype).emoji,
  }));

  return parsePlan({
    schemaVersion: 1,
    meta: {
      locale: answers.locale,
      projectName: output.projectName,
      idea: answers.idea,
      goal: answers.goal,
      experience: answers.experience,
      tools: answers.tools,
      createdAt: now.toISOString(),
    },
    stack: output.stack,
    roles,
    ownership: output.ownership,
    steps: output.steps,
    scaffold: deriveScaffold(output.ownership),
  });
}

/**
 * The folder layout, computed from who owns what.
 *
 * Asking a model for the ownership map *and* the folder list invites the two
 * to disagree -- a directory nobody owns, or an owner pointing at a directory
 * that was never created. Deriving one from the other makes that impossible.
 */
export function deriveScaffold(ownership: OwnershipRule[]): ScaffoldEntry[] {
  const dirs = new Map<string, string | undefined>();

  for (const rule of ownership) {
    // Only real ownership shapes the layout. A read-only or forbidden path
    // belongs to somebody else, and that somebody will bring it with them.
    if (rule.mode !== "owns" && rule.mode !== "shared") continue;

    const dir = directoryOf(rule.glob);
    if (!dir) continue;

    const owner = rule.mode === "owns" ? rule.roleId : undefined;
    // First writer wins; a shared directory stays unattributed.
    if (!dirs.has(dir)) dirs.set(dir, owner);
    else if (dirs.get(dir) !== owner) dirs.set(dir, undefined);
  }

  // Parent directories are implied by their children and would otherwise be
  // listed as separate, ownerless entries.
  const all = [...dirs.keys()];
  const leaves = all.filter((d) => !all.some((other) => other !== d && other.startsWith(`${d}/`)));

  return [...dirs.entries()]
    .filter(([dir]) => leaves.includes(dir))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, ownerRoleId]) => ({
      path,
      kind: "dir" as const,
      ...(ownerRoleId ? { ownerRoleId } : {}),
    }));
}

/**
 * The directory a glob lives in.
 *
 *   app/**            -> app
 *   components/*.tsx  -> components
 *   shared/types.ts   -> shared
 *   README.md         -> (none: it sits at the root)
 */
function directoryOf(glob: string): string | undefined {
  const segments = glob.split("/").filter((s) => s.length > 0);
  const dirSegments: string[] = [];

  for (const segment of segments) {
    if (segment.includes("*") || segment.includes(".")) break;
    dirSegments.push(segment);
  }

  if (dirSegments.length === 0) return undefined;
  return dirSegments.join("/");
}
