/**
 * What we ask a language model to produce.
 *
 * Deliberately narrower than a full Plan. The model is asked only for the
 * judgement calls -- what the team should be, who owns what, what order --
 * while everything mechanical is derived in `assemble.ts`. Two reasons:
 *
 *  - Less surface to get wrong. Every field the model does not write is a
 *    field it cannot hallucinate.
 *  - The folder layout is computed from the ownership map, so the two can
 *    never disagree. A model asked for both would eventually contradict itself.
 *
 * Emoji are ours too: they come from the archetype, so a plan cannot arrive
 * with a role labelled with an unrelated picture.
 */
import { z } from "zod";
import { archetypeIdSchema, ownershipModeSchema, toolIdSchema } from "../core/schema.js";

const idSchema = z.string().regex(/^[a-z][a-z0-9-]*$/);

export const plannerOutputSchema = z.object({
  projectName: z.string().min(1).max(60),
  stack: z.object({
    name: z.string().min(1),
    /** Plain language, aimed at someone who has never chosen a stack before. */
    why: z.string().min(1),
    packages: z.array(z.string()).default([]),
  }),
  /**
   * Two to four. One agent is not a team and needs no coordination; five is
   * more sessions than a beginner can drive, and the product promises 2-4.
   */
  roles: z
    .array(
      z.object({
        id: idSchema,
        archetype: archetypeIdSchema,
        displayName: z.string().min(1),
        summary: z.string().min(1),
        responsibilities: z.array(z.string().min(1)).min(1).max(6),
        consults: z.array(idSchema).default([]),
        tool: toolIdSchema,
      }),
    )
    .min(2)
    .max(4),
  ownership: z
    .array(
      z.object({
        glob: z.string().min(1),
        roleId: idSchema,
        mode: ownershipModeSchema,
        note: z.string().optional(),
      }),
    )
    .min(1),
  steps: z
    .array(
      z.object({
        id: idSchema,
        roleId: idSchema,
        phase: z.number().int().min(1),
        title: z.string().min(1),
        goal: z.string().min(1),
        tasks: z.array(z.string().min(1)).min(1).max(8),
        doneWhen: z.array(z.string().min(1)).min(1).max(5),
        handoffTo: z.array(idSchema).default([]),
      }),
    )
    .min(1),
});

export type PlannerOutput = z.infer<typeof plannerOutputSchema>;
