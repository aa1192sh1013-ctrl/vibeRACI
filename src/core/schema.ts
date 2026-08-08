/**
 * The single source of truth for a vibeRACI project.
 *
 * Everything the user ever sees -- CLAUDE.md, AGENTS.md, agent charters, the
 * copy-paste prompts, the runbook -- is a deterministic render of one Plan.
 * Nothing downstream may invent facts that are not in here.
 *
 * Design note on language: a Plan is *mostly* language-neutral. Fixed framework
 * wording (headings, boilerplate, safety rules) lives in `strings.ts` and is
 * translated at render time. Project-specific wording that only a planner can
 * write ("Build the product upload screen") is stored in `meta.locale`.
 */
import { z } from "zod";

export const localeSchema = z.enum(["en", "ko"]);
export type Locale = z.infer<typeof localeSchema>;

/** Coding agents vibeRACI knows how to write instructions for. */
export const toolIdSchema = z.enum(["claude-code", "codex"]);
export type ToolId = z.infer<typeof toolIdSchema>;

/**
 * A small fixed set of role archetypes. The planner picks and tailors from
 * these rather than inventing roles freely -- it keeps output testable and
 * stops the product from generating six agents to look sophisticated.
 */
export const archetypeIdSchema = z.enum([
  "architect",
  "ui-developer",
  "feature-developer",
  "reviewer",
  "fullstack",
]);
export type ArchetypeId = z.infer<typeof archetypeIdSchema>;

/**
 * What a role may do with a set of paths.
 * - owns    : may create and edit freely
 * - reads   : may read for context, must not edit
 * - shared  : may edit, but must flag the change for handoff
 * - denied  : must not read or edit
 */
export const ownershipModeSchema = z.enum(["owns", "reads", "shared", "denied"]);
export type OwnershipMode = z.infer<typeof ownershipModeSchema>;

const idSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "ids must be lowercase kebab-case");

export const ownershipRuleSchema = z.object({
  glob: z.string().min(1),
  roleId: idSchema,
  mode: ownershipModeSchema,
  /** Plain-language reason, shown to the user for `shared` paths. */
  note: z.string().optional(),
});
export type OwnershipRule = z.infer<typeof ownershipRuleSchema>;

export const roleSchema = z.object({
  id: idSchema,
  archetype: archetypeIdSchema,
  /** Shown to the user. Never expose RACI vocabulary here. */
  emoji: z.string().min(1),
  displayName: z.string().min(1),
  /** One plain sentence. "Builds the screens people actually click on." */
  summary: z.string().min(1),
  responsibilities: z.array(z.string().min(1)).min(1),
  /** Role ids this role should ask before changing shared ground. */
  consults: z.array(idSchema).default([]),
  tool: toolIdSchema,
});
export type Role = z.infer<typeof roleSchema>;

export const stepSchema = z.object({
  id: idSchema,
  roleId: idSchema,
  /**
   * Steps with the same phase number have no dependency on each other.
   * We surface that as information ("these are independent"), not as an
   * instruction to run them simultaneously -- two agents in one directory
   * overwrite each other, and beginners should not be handed that trap.
   */
  phase: z.number().int().min(1),
  title: z.string().min(1),
  goal: z.string().min(1),
  tasks: z.array(z.string().min(1)).min(1),
  /** Checkable, file-level evidence the step is actually finished. */
  doneWhen: z.array(z.string().min(1)).min(1),
  /** Roles that need a summary of what changed once this step lands. */
  handoffTo: z.array(idSchema).default([]),
});
export type Step = z.infer<typeof stepSchema>;

export const scaffoldEntrySchema = z.object({
  path: z.string().min(1),
  kind: z.enum(["dir", "file"]),
  ownerRoleId: idSchema.optional(),
  /** Only for `file`. Omitted means "create empty". */
  content: z.string().optional(),
});
export type ScaffoldEntry = z.infer<typeof scaffoldEntrySchema>;

export const planSchema = z
  .object({
    schemaVersion: z.literal(1),
    meta: z.object({
      locale: localeSchema,
      projectName: z.string().min(1),
      idea: z.string().min(1),
      goal: z.enum(["demo", "mvp", "deploy"]),
      experience: z.enum(["none", "some", "developer"]),
      tools: z.array(toolIdSchema).min(1),
      createdAt: z.string().min(1),
    }),
    stack: z.object({
      name: z.string().min(1),
      why: z.string().min(1),
      packages: z.array(z.string()).default([]),
    }),
    /**
     * Hard cap of 5. If a plan wants more than this, the plan is wrong --
     * beginners cannot drive six sessions, and the product promise is 2-4.
     */
    roles: z.array(roleSchema).min(1).max(5),
    ownership: z.array(ownershipRuleSchema),
    steps: z.array(stepSchema).min(1),
    scaffold: z.array(scaffoldEntrySchema),
  })
  .superRefine(validatePlanIntegrity);

export type Plan = z.infer<typeof planSchema>;

/**
 * Cross-field checks that a per-field schema cannot express. These are the
 * seed of the conflict detection the product eventually wants: a plan that
 * fails here would have produced agents that silently trample each other.
 */
function validatePlanIntegrity(
  plan: {
    roles: Role[];
    ownership: OwnershipRule[];
    steps: Step[];
    scaffold: ScaffoldEntry[];
  },
  ctx: z.RefinementCtx,
): void {
  const roleIds = new Set(plan.roles.map((r) => r.id));

  const fail = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

  plan.roles.forEach((role, i) => {
    if (plan.roles.filter((r) => r.id === role.id).length > 1) {
      fail(["roles", i, "id"], `duplicate role id "${role.id}"`);
    }
    role.consults.forEach((c, j) => {
      if (c === role.id) fail(["roles", i, "consults", j], "a role cannot consult itself");
      else if (!roleIds.has(c)) fail(["roles", i, "consults", j], `unknown role "${c}"`);
    });
  });

  // Every path may have at most one owner. Two owners is the exact bug the
  // product exists to prevent, so it must be impossible to express.
  const owners = new Map<string, string>();
  plan.ownership.forEach((rule, i) => {
    if (!roleIds.has(rule.roleId)) {
      fail(["ownership", i, "roleId"], `unknown role "${rule.roleId}"`);
    }
    if (rule.mode !== "owns") return;
    const existing = owners.get(rule.glob);
    if (existing && existing !== rule.roleId) {
      fail(
        ["ownership", i, "glob"],
        `"${rule.glob}" is owned by both "${existing}" and "${rule.roleId}" -- use mode "shared" instead`,
      );
    }
    owners.set(rule.glob, rule.roleId);
  });

  plan.ownership.forEach((rule, i) => {
    if (rule.mode === "shared" && !rule.note) {
      fail(["ownership", i, "note"], "shared paths must explain what to do before editing");
    }
  });

  const stepIds = new Set<string>();
  plan.steps.forEach((step, i) => {
    if (stepIds.has(step.id)) fail(["steps", i, "id"], `duplicate step id "${step.id}"`);
    stepIds.add(step.id);

    if (!roleIds.has(step.roleId)) {
      fail(["steps", i, "roleId"], `unknown role "${step.roleId}"`);
    }
    step.handoffTo.forEach((h, j) => {
      if (h === step.roleId) fail(["steps", i, "handoffTo", j], "a step cannot hand off to its own role");
      else if (!roleIds.has(h)) fail(["steps", i, "handoffTo", j], `unknown role "${h}"`);
    });
  });

  // Phases must start at 1 and not skip, or the runbook prints "Step 3" with
  // no step 2 and the user assumes something went missing.
  const phases = [...new Set(plan.steps.map((s) => s.phase))].sort((a, b) => a - b);
  phases.forEach((phase, i) => {
    if (phase !== i + 1) {
      fail(["steps"], `phases must run 1,2,3... without gaps (got ${phases.join(",")})`);
    }
  });

  // A role with no step is a role the user is never told to run.
  plan.roles.forEach((role, i) => {
    if (!plan.steps.some((s) => s.roleId === role.id)) {
      fail(["roles", i], `role "${role.id}" has no step, so the user would never run it`);
    }
  });

  plan.scaffold.forEach((entry, i) => {
    if (entry.ownerRoleId && !roleIds.has(entry.ownerRoleId)) {
      fail(["scaffold", i, "ownerRoleId"], `unknown role "${entry.ownerRoleId}"`);
    }
    if (entry.kind === "dir" && entry.content !== undefined) {
      fail(["scaffold", i, "content"], "directories cannot have content");
    }
  });
}

/** Parse and validate. Throws a ZodError listing every problem at once. */
export function parsePlan(input: unknown): Plan {
  return planSchema.parse(input);
}

export function safeParsePlan(input: unknown) {
  return planSchema.safeParse(input);
}
