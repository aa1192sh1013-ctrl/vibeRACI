#!/usr/bin/env node
/**
 * The `vibesquad` command.
 *
 * Argument parsing is hand-rolled. There are six commands and four flags; a
 * parser library would be more code to read than the thing it parses, and this
 * repository is meant to be understandable by someone who has never seen it.
 *
 * Every path out of here ends with the user knowing the next command to type.
 */
import { ZodError } from "zod";
import { goalSchema } from "../planner/answers.js";
import { enumFlag, numberFlag, textFlag } from "./flags.js";
import { resolveLocale } from "./locale.js";
import { runDoctor } from "./commands/doctor.js";
import { runDone, runUndo } from "./commands/done.js";
import { runInit } from "./commands/init.js";
import { runNext } from "./commands/next.js";
import { runStatus } from "./commands/status.js";
import { runUi } from "./commands/ui.js";
import { FriendlyError, openProject } from "./project.js";
import { bold, cyan, dim, problem, say } from "./ui.js";

/**
 * Columns are computed rather than typed out. Hand-counted padding drifts the
 * moment a command is renamed, and a ragged help screen is the first thing a
 * new user sees.
 */
function twoColumns(rows: [string, string][], colour: (text: string) => string): string {
  const width = Math.max(...rows.map(([left]) => left.length));
  return rows
    .map(([left, right]) => `  ${colour(left)}${" ".repeat(width - left.length)}   ${right}`)
    .join("\n");
}

const HELP = `${bold("vibesquad")} - build your AI coding team

${twoColumns(
  [
    ["vibesquad ui", "do all of this in your browser"],
    ['vibesquad init "what you want to build"', "plan a project and set it up"],
    ["vibesquad init", dim("(no idea given: it asks you)")],
    ["vibesquad next", "what to do right now"],
    ["vibesquad done", "tick that off, show what is next"],
    ["vibesquad status", "the whole plan and where you are"],
    ["vibesquad undo", "untick the last step"],
    ["vibesquad doctor", "check this computer is ready"],
  ],
  cyan,
)}

${dim("flags")}
${twoColumns(
  [
    ["--copy", `put the prompt straight on your clipboard   ${dim("(next)")}`],
    ["--show", `print the prompt here instead of a path     ${dim("(next)")}`],
    ["--lang ko", `write the plan in Korean                    ${dim("(init)")}`],
    ["--goal demo|mvp|deploy", dim("(init)")],
    ["--dir <folder>", `work in this folder instead of here        ${dim("(init, ui)")}`],
    ["--port <number>", `serve the page on this port                ${dim("(ui)")}`],
  ],
  (text) => text,
)}
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
      await runInit({
        idea: positional.join(" ") || undefined,
        locale,
        goal: enumFlag(flags.get("goal"), goalSchema, "goal"),
        dir: textFlag(flags.get("dir"), "dir"),
        interactive: flags.has("ask"),
      });
      return 0;
    }

    case "ui": {
      await runUi({
        locale,
        port: numberFlag(flags.get("port"), "port"),
        dir: textFlag(flags.get("dir"), "dir"),
        open: !flags.has("no-open"),
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
    } else if (error instanceof ZodError) {
      // Left alone, a ZodError prints its issues as a JSON array. That is a
      // stack trace by another name: nobody it reaches can act on it.
      problem("The plan that came back did not make sense:");
      for (const issue of error.issues) {
        const path = issue.path.join(".");
        say(dim(`  - ${path ? `${path}: ` : ""}${issue.message}`));
      }
      say(dim("  Run the command again -- planning is not deterministic."));
    } else {
      problem(error instanceof Error ? error.message : String(error));
    }
    say();
    process.exitCode = 1;
  });
