/**
 * What the page needs to draw itself, in one object.
 *
 * The page holds no logic of its own: it renders whatever this says and posts
 * back when a button is pressed. Everything that decides anything -- validation,
 * ownership, ordering -- stays in the same code the command line uses, so the
 * two can never drift into disagreeing about what a project is.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale, Plan } from "../core/schema.js";
import { parsePlan } from "../core/schema.js";
import { toolName } from "../core/strings.js";
import { type ToolCapability, detectAll } from "../planner/capabilities.js";
import { PLAN_PATH, currentStep, isComplete, loadProgress, stepStatuses } from "../progress/progress.js";
import { promptPath, stepEmoji } from "../render/shared.js";

export interface UiStep {
  id: string;
  number: number;
  title: string;
  emoji: string;
  state: "done" | "current" | "waiting";
  kind: "agent" | "human";
}

export interface UiState {
  locale: Locale;
  dir: string;
  tools: ToolCapability[];
  /** At least one coding tool looks usable. */
  ready: boolean;
  hasProject: boolean;
  project?: {
    name: string;
    idea: string;
    stack: string;
    stackWhy: string;
    roles: { emoji: string; name: string; summary: string }[];
    steps: UiStep[];
    finished: boolean;
    current?: {
      id: string;
      number: number;
      total: number;
      title: string;
      emoji: string;
      goal: string;
      kind: "agent" | "human";
      /** Agent steps only: the text to copy, and where it lives. */
      prompt?: string;
      promptFile?: string;
      tool?: string;
      /** Human steps only. */
      tasks?: string[];
      doneWhen: string[];
    };
  };
}

export function readPlan(dir: string): Plan | undefined {
  const file = join(dir, PLAN_PATH);
  if (!existsSync(file)) return undefined;
  try {
    return parsePlan(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    // A damaged plan is reported as "no project" rather than a stack trace.
    // The page offers to make one, which is the only useful move from here.
    return undefined;
  }
}

export function buildState(dir: string, locale: Locale): UiState {
  const tools = detectAll(process.env, locale);
  const ready = tools.some((t) => t.id !== "anthropic-api" && t.status !== "not-installed");
  const plan = readPlan(dir);

  if (!plan) return { locale, dir, tools, ready, hasProject: false };

  const progress = loadProgress(dir, plan);
  const statuses = stepStatuses(plan, progress);
  const step = currentStep(plan, progress);

  const steps: UiStep[] = statuses.map((s) => ({
    id: s.step.id,
    number: s.number,
    title: s.step.title,
    emoji: stepEmoji(plan, s.step),
    state: s.state,
    kind: s.step.kind,
  }));

  const current = step
    ? (() => {
        const position = statuses.find((s) => s.step.id === step.id)?.number ?? 1;
        const role = step.roleId ? plan.roles.find((r) => r.id === step.roleId) : undefined;
        const file = join(dir, promptPath(step));
        return {
          id: step.id,
          number: position,
          total: steps.length,
          title: step.title,
          emoji: stepEmoji(plan, step),
          goal: step.goal,
          kind: step.kind,
          prompt:
            step.kind === "agent" && existsSync(file) ? readFileSync(file, "utf8") : undefined,
          promptFile: step.kind === "agent" ? promptPath(step) : undefined,
          tool: role ? toolName(role.tool) : undefined,
          tasks: step.kind === "human" ? step.tasks : undefined,
          doneWhen: step.doneWhen,
        };
      })()
    : undefined;

  return {
    locale,
    dir,
    tools,
    ready,
    hasProject: true,
    project: {
      name: plan.meta.projectName,
      idea: plan.meta.idea,
      stack: plan.stack.name,
      stackWhy: plan.stack.why,
      roles: plan.roles.map((r) => ({ emoji: r.emoji, name: r.displayName, summary: r.summary })),
      steps,
      finished: isComplete(plan, progress),
      current,
    },
  };
}
