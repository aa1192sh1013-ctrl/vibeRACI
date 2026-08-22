/**
 * Checking flag values before anything acts on them.
 *
 * These live apart from `index.ts` so they can be tested: that file runs the
 * command line the moment it is imported.
 *
 * The rule they exist for is that a wrong flag should cost a sentence, not a
 * planning call. `--goal working` used to be accepted, cast to the right type
 * on the way past, and spend the whole five-minute run before the finished
 * plan failed validation with a page of JSON. Every value a user can type is
 * now checked at the boundary, against the same list the planner uses.
 */
import type { z } from "zod";
import { FriendlyError } from "./project.js";

/** A flag whose value has to be one of a fixed set. */
export function enumFlag<T extends string>(
  raw: string | true | undefined,
  schema: z.ZodEnum<[T, ...T[]]>,
  flag: string,
): T | undefined {
  if (raw === undefined) return undefined;

  const choices = schema.options.join(", ");
  if (raw === true) {
    throw new FriendlyError(`--${flag} needs a value.`, `Use one of:  ${choices}`);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new FriendlyError(`--${flag} does not understand "${raw}".`, `Use one of:  ${choices}`);
  }
  return parsed.data;
}

/** A flag that has to be a whole number. `--port abc` is NaN, and NaN is a bug. */
export function numberFlag(raw: string | true | undefined, flag: string): number | undefined {
  if (raw === undefined) return undefined;
  if (raw === true) throw new FriendlyError(`--${flag} needs a value.`);

  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new FriendlyError(`--${flag} should be a whole number, not "${raw}".`);
  }
  return value;
}

/** A flag that has to name something. `--dir` with nothing after it is a slip. */
export function textFlag(raw: string | true | undefined, flag: string): string | undefined {
  if (raw === undefined) return undefined;
  if (raw === true) throw new FriendlyError(`--${flag} needs a value.`);
  return raw;
}
