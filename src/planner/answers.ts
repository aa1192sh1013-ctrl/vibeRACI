/**
 * The handful of things we ask the user before planning anything.
 *
 * Four questions is the budget. The target user abandons forms, and every
 * extra question buys less than it costs -- most of what a plan needs can be
 * inferred from the idea itself.
 */
import { z } from "zod";
import { localeSchema, toolIdSchema } from "../core/schema.js";

export const answersSchema = z.object({
  /** Free text. "I want a marketplace where people sell used furniture." */
  idea: z.string().min(1),
  /**
   * A written brief the user attached, if any. Kept apart from `idea` because
   * `idea` becomes the one-line description shown on every screen, and a
   * pasted-in document would fill it. The planner sees both.
   */
  brief: z.string().optional(),
  /** How far they want to take it, which decides how much team is warranted. */
  goal: z.enum(["demo", "mvp", "deploy"]),
  experience: z.enum(["none", "some", "developer"]),
  tools: z.array(toolIdSchema).min(1),
  locale: localeSchema,
});

export type Answers = z.infer<typeof answersSchema>;
