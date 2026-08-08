/**
 * The instructions we give the planning model.
 *
 * Most of the rules here mirror checks in the plan schema. That duplication is
 * on purpose: the schema is what makes a bad plan impossible, and the prompt is
 * what makes a bad plan unlikely. Stating a rule only in the schema means
 * burning a retry to teach it; stating it only in the prompt means trusting it.
 */
import { ARCHETYPES } from "../core/archetypes.js";
import type { Locale } from "../core/schema.js";
import type { Answers } from "./answers.js";
import { plannerJsonSchemaText } from "./json-schema.js";
import { toolName } from "../core/strings.js";

const LOCALE_NAMES: Record<Locale, string> = { en: "English", ko: "Korean" };

export function buildSystemPrompt(): string {
  const archetypes = Object.values(ARCHETYPES)
    .map((a) => `- ${a.id}: ${a.summary.en}`)
    .join("\n");

  return `You plan small AI coding teams for people who have never built software before.

The user has an idea and access to coding agents like Claude Code or Codex. They do
not know how many sessions to open, what to put in each, or how to stop two agents
from overwriting each other. You decide that for them.

Pick from these role archetypes only:
${archetypes}

RULES

1. Two to four roles. Never more. A small project deserves two; do not invent a
   reviewer or an architect to look thorough. Prefer fewer.
2. Exactly one role owns any given path. If two roles genuinely both need to edit
   something, mark it "shared" for both and write a note saying what to do before
   editing it.
3. Use "reads" for paths a role must consult but not change -- an API contract, a
   data model. Agents that cannot read their neighbours guess instead.
4. Use "denied" only for genuinely dangerous ground, like database migrations.
5. Every role must have at least one step, or the user is never told to run it.
6. Phases start at 1 and never skip. Steps in the same phase must not depend on
   each other. Anything that must happen first gets an earlier phase.
7. "doneWhen" must be checkable by looking at the project -- "docs/api.md exists",
   "a new account can be created". Never "the code is good".
8. Write for someone who has never programmed. No jargon. Never use the words
   responsible, accountable, consulted or informed as labels. Say what a role does
   in one plain sentence: "Builds the screens people actually click on."
9. Choose a stack a beginner can run locally without configuring anything.

SHAPE

Your answer must match this JSON Schema exactly. Use these field names and no
others. Every field without a default is required.

${plannerJsonSchemaText()}

Return only that JSON object. No prose, no markdown fence, no explanation.`;
}

export function buildUserPrompt(answers: Answers): string {
  const goal = {
    demo: "A visual demo. It only needs to look right, not to work end to end.",
    mvp: "A working version they can use themselves.",
    deploy: "Something they can put online for other people to use.",
  }[answers.goal];

  const experience = {
    none: "They have never written code. Assume nothing.",
    some: "They have written a little code but have never structured a project.",
    developer: "They can code, but have not run a multi-agent workflow before.",
  }[answers.experience];

  const tools = answers.tools.map(toolName).join(" and ");

  return `IDEA
${answers.idea}

HOW FAR THEY WANT TO GO
${goal}

THEIR EXPERIENCE
${experience}

TOOLS THEY HAVE
${tools}. Assign every role to one of these, and only these.

LANGUAGE
Write every piece of text a person will read -- displayName, summary,
responsibilities, titles, goals, tasks, doneWhen, stack.why, notes -- in
${LOCALE_NAMES[answers.locale]}. Keep ids, globs and archetype names in English.

Return the JSON object now.`;
}

/**
 * Fed back after a rejected attempt. Blunt on purpose: the failures are almost
 * always a rule the model skimmed, and restating it politely wastes a retry.
 */
export function buildRepairPrompt(problems: string[]): string {
  return `That plan was rejected:

${problems.map((p) => `- ${p}`).join("\n")}

Fix every problem listed and return the corrected JSON object. Nothing else.`;
}
