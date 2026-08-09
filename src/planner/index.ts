/**
 * Idea in, validated Plan out.
 *
 * Two ideas hold this together.
 *
 * First, lanes are tried in order and their failures are interpreted, rather
 * than probed for up front. Claude has no free way to test its login, so a
 * probe would either cost a request or lie. Trying and reading the error is
 * cheaper and more honest -- and the errors are the ones M0 actually saw.
 *
 * Second, a rejected plan is repaired, not discarded. The schema knows exactly
 * what is wrong with it, so those complaints go straight back to the model.
 * Most rejections are one skimmed rule, and one retry usually settles it.
 *
 * If every lane fails the user still gets a project, built from rules, and is
 * told that is what happened.
 */
import { ZodError } from "zod";
import type { Plan } from "../core/schema.js";
import type { Answers } from "./answers.js";
import { assemblePlan } from "./assemble.js";
import { detectCodex, explainProviderFailure } from "./capabilities.js";
import { extractJson } from "./extract-json.js";
import { plannerJsonSchema } from "./json-schema.js";
import { plannerOutputSchema } from "./output-schema.js";
import { buildRepairPrompt, buildSystemPrompt, buildUserPrompt } from "./prompt.js";
import { createAnthropicApiProvider } from "./providers/anthropic-api.js";
import { createClaudeCliProvider } from "./providers/claude-cli.js";
import { createCodexCliProvider } from "./providers/codex-cli.js";
import { ProviderError, type Provider } from "./providers/types.js";
import { buildTemplateOutput } from "./template.js";

export type PlanSource = "claude-cli" | "codex-cli" | "anthropic-api" | "template";

export interface PlanResult {
  plan: Plan;
  source: PlanSource;
  /** What went wrong on the way, already in words the user can act on. */
  notes: string[];
}

export interface CreatePlanOptions {
  /** Overrides lane selection. Mainly for tests and for `--tool`. */
  providers?: Provider[];
  /** Fall back to the rule-built plan when every lane fails. */
  allowTemplate?: boolean;
  /** Retries given to a model whose plan was rejected. */
  maxRepairAttempts?: number;
  now?: Date;
  env?: NodeJS.ProcessEnv;
}

export async function createPlan(
  answers: Answers,
  options: CreatePlanOptions = {},
): Promise<PlanResult> {
  const {
    allowTemplate = true,
    maxRepairAttempts = 1,
    now = new Date(),
    env = process.env,
  } = options;

  const providers = options.providers ?? chooseProviders(answers, env);
  const notes: string[] = [];

  for (const provider of providers) {
    try {
      const output = await planWithProvider(provider, answers, maxRepairAttempts);
      return { plan: assemblePlan(answers, output, now), source: provider.id as PlanSource, notes };
    } catch (error) {
      notes.push(
        `${provider.label}: ${
          error instanceof ProviderError
            ? explainProviderFailure(provider.id, error.message, answers.locale)
            : error instanceof Error
              ? error.message
              : String(error)
        }`,
      );
    }
  }

  if (!allowTemplate) {
    throw new Error(
      `No AI tool could plan this project.\n\n${notes.join("\n\n")}`,
    );
  }

  notes.push(
    "Built a general-purpose plan without using AI. It will work, but it does not know the details of your idea -- you can edit .viberaci/plan.json and run again.",
  );
  return {
    plan: assemblePlan(answers, buildTemplateOutput(answers), now),
    source: "template",
    notes,
  };
}

/**
 * Which lanes to try, in order.
 *
 * The tools the user chose come first: a plan built by the tool they will
 * actually run is a plan that fits it. Codex is only offered when its free
 * login check passes, since there is no reason to spend a failure on it.
 */
export function chooseProviders(answers: Answers, env: NodeJS.ProcessEnv): Provider[] {
  const providers: Provider[] = [];
  const prefersClaude = answers.tools.includes("claude-code");

  const claude = () => createClaudeCliProvider();
  const codex = () =>
    detectCodex().status === "ready" ? createCodexCliProvider(plannerJsonSchema()) : undefined;

  const ordered = prefersClaude ? [claude(), codex()] : [codex(), claude()];
  for (const provider of ordered) if (provider) providers.push(provider);

  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (apiKey) providers.push(createAnthropicApiProvider(apiKey));

  return providers;
}

async function planWithProvider(
  provider: Provider,
  answers: Answers,
  maxRepairAttempts: number,
) {
  const system = buildSystemPrompt();
  let user = buildUserPrompt(answers);
  let lastProblems: string[] = [];

  for (let attempt = 0; attempt <= maxRepairAttempts; attempt++) {
    const raw = await provider.complete({ system, user });

    try {
      const output = plannerOutputSchema.parse(extractJson(raw));
      // Assembling runs the full plan schema, which catches the cross-field
      // contradictions the narrower output schema cannot see.
      assemblePlan(answers, output);
      return output;
    } catch (error) {
      lastProblems = describeProblems(error);
      user = `${buildUserPrompt(answers)}\n\nYour previous answer:\n${raw.slice(0, 4000)}\n\n${buildRepairPrompt(lastProblems)}`;
    }
  }

  throw new ProviderError(
    provider.id,
    `could not produce a usable plan after ${maxRepairAttempts + 1} attempts:\n${lastProblems
      .map((p) => `  - ${p}`)
      .join("\n")}`,
  );
}

function describeProblems(error: unknown): string[] {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });
  }
  return [error instanceof Error ? error.message : String(error)];
}

export { assemblePlan } from "./assemble.js";
export { buildTemplateOutput } from "./template.js";
export { detectAll, explainProviderFailure } from "./capabilities.js";
export type { Answers } from "./answers.js";
