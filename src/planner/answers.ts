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
  /** How far they want to take it, which decides how much team is warranted. */
  goal: z.enum(["demo", "mvp", "deploy"]),
  experience: z.enum(["none", "some", "developer"]),
  tools: z.array(toolIdSchema).min(1),
  locale: localeSchema,
});

export type Answers = z.infer<typeof answersSchema>;
