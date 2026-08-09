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

const GOAL_CHOICES: { key: string; value: Answers["goal"]; label: string }[] = [
  { key: "1", value: "demo", label: "Just something to look at" },
  { key: "2", value: "mvp", label: "Something that actually works" },
  { key: "3", value: "deploy", label: "Something other people can use online" },
];

export async function runInit(options: InitOptions = {}): Promise<void> {
  const dir = resolve(options.dir ?? process.cwd());

  if (isProjectDir(dir)) {
    throw new FriendlyError(
      "There is already a vibeRACI project in this folder.",
      "Run  viberaci status  to see it, or start somewhere else.",
    );
  }

  const answers = await collectAnswers(options);

  const tools = availableTools();
  if (tools.length === 0) {
    warn("Neither Claude Code nor Codex is usable on this computer.");
    say(dim("  Run  viberaci doctor  to see why."));
    say(dim("  Carrying on anyway: you will get a general plan rather than one about your idea."));
  }

  heading("Working out your team");
  say(dim("This takes a minute. It is one request to your own coding tool."));

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
    ok(`${report.created.length} files created`);
  } catch (error) {
    if (error instanceof ScaffoldConflictError) {
      throw new FriendlyError(
        "This folder already has files with those names, so nothing was written.",
        "Start in an empty folder instead.",
      );
    }
    throw error;
  }

  const git = initGitRepo(dir);
  if (git.initialised) ok("git started, so you can undo anything later");

  say();
  say(`  ${dim("your build order is in")} ${cyan("START-HERE.md")}`);

  runNext(openProject(dir));
}

/** Only tools that are genuinely here. See the note at the top of this file. */
function availableTools(): ToolId[] {
  const found = detectAll();
  const tools: ToolId[] = [];
  if (found.find((c) => c.id === "claude-cli")?.status !== "not-installed") tools.push("claude-code");
  if (found.find((c) => c.id === "codex-cli")?.status === "ready") tools.push("codex");
  return tools;
}

async function collectAnswers(options: InitOptions): Promise<Omit<Answers, "tools">> {
  const locale = options.locale ?? "en";

  if (options.idea && !options.interactive) {
    return {
      idea: options.idea,
      goal: options.goal ?? "mvp",
      experience: options.experience ?? "none",
      locale,
    };
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    let idea = options.idea ?? "";
    while (idea.trim().length === 0) {
      say();
      say(bold("What do you want to build?"));
      say(dim("  A sentence or two is plenty. Plain words are fine."));
      idea = await rl.question("> ");
    }

    say();
    say(bold("How far do you want to take it?"));
    for (const choice of GOAL_CHOICES) say(`  ${choice.key}. ${choice.label}`);
    const picked = (await rl.question("> ")).trim();
    const goal = GOAL_CHOICES.find((c) => c.key === picked)?.value ?? options.goal ?? "mvp";

    return { idea: idea.trim(), goal, experience: options.experience ?? "none", locale };
  } finally {
    rl.close();
  }
}
