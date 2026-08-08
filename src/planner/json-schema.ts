/**
 * The expected answer shape, derived from the schema that validates it.
 *
 * The first real run failed on exactly this: the prompt explained the rules at
 * length but never said what the JSON should look like, so the model invented
 * its own field names and every attempt was rejected on `Required`. Describing
 * the shape in prose would have worked until someone edited the schema and
 * forgot to edit the description; generating it means the two cannot drift.
 *
 * It doubles as the file passed to `codex exec --output-schema`, which
 * constrains the answer rather than merely requesting it.
 */
import { zodToJsonSchema } from "zod-to-json-schema";
import { plannerOutputSchema } from "./output-schema.js";

let cached: string | undefined;

export function plannerJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(plannerOutputSchema, {
    name: undefined,
    $refStrategy: "none",
    target: "jsonSchema7",
  }) as Record<string, unknown>;
}

export function plannerJsonSchemaText(): string {
  cached ??= JSON.stringify(plannerJsonSchema(), null, 2);
  return cached;
}
