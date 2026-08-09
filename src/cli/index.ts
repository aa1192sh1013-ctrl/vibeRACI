#!/usr/bin/env node
/**
 * The `viberaci` command.
 *
 * Argument parsing is hand-rolled. There are six commands and four flags; a
 * parser library would be more code to read than the thing it parses, and this
 * repository is meant to be understandable by someone who has never seen it.
 *
 * Every path out of here ends with the user knowing the next command to type.
 */
import type { Answers } from "../planner/answers.js";
import { resolveLocale } from "./locale.js";
import { runDoctor } from "./commands/doctor.js";
import { runDone, runUndo } from "./commands/done.js";
import { runInit } from "./commands/init.js";
import { runNext } from "./commands/next.js";
import { runStatus } from "./commands/status.js";
import { FriendlyError, openProject } from "./project.js";
import { bold, cyan, dim, problem, say } from "./ui.js";

const HELP = `${bold("viberaci")} - build your AI coding team

  ${cyan("viberaci init")} ${dim('"what you want to build"')}   plan a project and set it up
  ${cyan("viberaci next")}                          what to do right now
  ${cyan("viberaci done")}                          tick that off, show what is next
  ${cyan("viberaci status")}                        the whole plan and where you are
  ${cyan("viberaci undo")}                          untick the last step
  ${cyan("viberaci doctor")}                        check this computer is ready

${dim("flags")}
  --copy          put the prompt straight on your clipboard   ${dim("(next)")}
  --show          print the prompt here instead of a path     ${dim("(next)")}
  --lang ko       write the plan in Korean                    ${dim("(init)")}
  --goal demo|mvp|deploy                                      ${dim("(init)")}
`;

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Map<string, string | true>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags = new Map<string, string | true>();

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === undefined) continue;
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    const next = rest[i + 1];
    // A flag takes a value only when something that is not another flag follows.
    if (next !== undefined && !next.startsWith("--")) {
      flags.set(name, next);
      i++;
    } else {
      flags.set(name, true);
    }
  }

  return { command, positional, flags };
}

async function main(argv: string[]): Promise<number> {
  const { command, positional, flags } = parseArgs(argv);
  // Falls back to the operating system's language, so a Korean beginner is not
  // required to discover a flag before being spoken to in Korean.
  const locale = resolveLocale(flags.get("lang"));

  switch (command) {
    case "init": {
      const rawGoal = flags.get("goal");
      await runInit({
        idea: positional.join(" ") || undefined,
        locale,
        goal: typeof rawGoal === "string" ? (rawGoal as Answers["goal"]) : undefined,
        interactive: flags.has("ask"),
      });
      return 0;
    }

    case "next":
      runNext(openProject(process.cwd(), locale), {
        copy: flags.has("copy"),
        show: flags.has("show"),
      });
      return 0;

    case "done":
      runDone(openProject(process.cwd(), locale), positional[0]);
      return 0;

    case "undo":
      runUndo(openProject(process.cwd(), locale), positional[0]);
      return 0;

    case "status":
      runStatus(openProject(process.cwd(), locale));
      return 0;

    case "doctor":
      return runDoctor(locale);

    case "help":
    case "--help":
    case "-h":
      say(HELP);
      return 0;

    default:
      say(HELP);
      problem(`There is no command called "${command}".`);
      return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    say();
    if (error instanceof FriendlyError) {
      problem(error.message);
      if (error.hint) say(dim(`  ${error.hint}`));
    } else {
      problem(error instanceof Error ? error.message : String(error));
    }
    say();
    process.exitCode = 1;
  });
