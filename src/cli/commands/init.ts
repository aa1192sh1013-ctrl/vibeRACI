/**
 * `viberaci init` -- idea in, project on disk.
 *
 * Four questions is the whole interview, and three of them have a sensible
 * default. The target user abandons forms; every extra question costs more
 * than it buys, and most of what a plan needs is already in the idea.
 *
 * Which coding tools exist is never asked. M0 found a user actively using
 * Claude Code whose command line had never been logged in -- so the answer to
 * "which tools do you have?" is confidently wrong often enough that looking is
 * the only honest option.
 */
import { createInterface } from "node:readline/promises";
import { resolve } from "node:path";
import type { Locale, ToolId } from "../../core/schema.js";
import { strings } from "../../core/strings.js";
import type { Answers } from "../../planner/answers.js";
import { detectAll } from "../../planner/capabilities.js";
import { createPlan } from "../../planner/index.js";
import { initGitRepo } from "../../scaffold/git.js";
import { ScaffoldConflictError, scaffoldProject } from "../../scaffold/write.js";
import { isProjectDir } from "../../progress/progress.js";
import { FriendlyError, openProject } from "../project.js";
import { bold, cyan, dim, heading, ok, say, warn } from "../ui.js";
import { runNext } from "./next.js";

export interface InitOptions {
  idea?: string;
  goal?: Answers["goal"];
  experience?: Answers["experience"];
  locale?: Locale;
  dir?: string;
  interactive?: boolean;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const dir = resolve(options.dir ?? process.cwd());
  const s = strings(options.locale ?? "en");

  if (isProjectDir(dir)) {
    throw new FriendlyError(s.alreadyAProject, s.alreadyAProjectHint);
  }

  const answers = await collectAnswers(options);

  const tools = availableTools();
  if (tools.length === 0) {
    warn(s.noToolsUsable);
    say(dim(`  ${s.noToolsHint}`));
    say(dim(`  ${s.carryingOnAnyway}`));
  }

  heading(s.workingOutTeam);
  say(dim(s.planningTakesAMinute));

  const result = await createPlan({ ...answers, tools: tools.length > 0 ? tools : ["claude-code"] });
  for (const note of result.notes) {
    say();
    warn(note);
  }

  const plan = result.plan;

  heading(plan.meta.projectName);
  say(dim(`${plan.stack.name} - ${plan.stack.why}`));
  say();
  for (const role of plan.roles) {
    say(`  ${role.emoji} ${bold(role.displayName)}`);
    say(`     ${dim(role.summary)}`);
  }

  try {
    const report = scaffoldProject(plan, dir);
    say();
    ok(s.filesCreated(report.created.length));
  } catch (error) {
    if (error instanceof ScaffoldConflictError) {
      throw new FriendlyError(s.folderNotEmpty, s.folderNotEmptyHint);
    }
    throw error;
  }

  const git = initGitRepo(dir);
  if (git.initialised) ok(s.gitStarted);

  say();
  say(`  ${dim(s.buildOrderIn(cyan("START-HERE.md")))}`);

  runNext(openProject(dir, plan.meta.locale));
}

/** Only tools that are genuinely here. See the note at the top of this file. */
function availableTools(): ToolId[] {
  const found = detectAll(process.env);
  const tools: ToolId[] = [];
  if (found.find((c) => c.id === "claude-cli")?.status !== "not-installed") tools.push("claude-code");
  if (found.find((c) => c.id === "codex-cli")?.status === "ready") tools.push("codex");
  return tools;
}

async function collectAnswers(options: InitOptions): Promise<Omit<Answers, "tools">> {
  const locale = options.locale ?? "en";
  const s = strings(locale);

  if (options.idea && !options.interactive) {
    return {
      idea: options.idea,
      goal: options.goal ?? "mvp",
      experience: options.experience ?? "none",
      locale,
    };
  }

  const goals: { key: string; value: Answers["goal"]; label: string }[] = [
    { key: "1", value: "demo", label: s.goalDemo },
    { key: "2", value: "mvp", label: s.goalMvp },
    { key: "3", value: "deploy", label: s.goalDeploy },
  ];

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    let idea = options.idea ?? "";
    while (idea.trim().length === 0) {
      say();
      say(bold(s.askIdea));
      say(dim(`  ${s.askIdeaHint}`));
      idea = await rl.question("> ");
    }

    say();
    say(bold(s.askGoal));
    for (const choice of goals) say(`  ${choice.key}. ${choice.label}`);
    const picked = (await rl.question("> ")).trim();
    const goal = goals.find((c) => c.key === picked)?.value ?? options.goal ?? "mvp";

    return { idea: idea.trim(), goal, experience: options.experience ?? "none", locale };
  } finally {
    rl.close();
  }
}
