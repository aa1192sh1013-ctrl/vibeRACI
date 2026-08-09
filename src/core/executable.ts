/**
 * Where a command actually lives, if anywhere.
 *
 * Node launches programs without a shell, which on Windows means PATHEXT is
 * never applied. Asking for `codex` finds the extensionless shell script npm
 * writes for Git Bash, Windows cannot execute it, and the launch fails exactly
 * as if the tool were not installed -- so vibesquad told a user with Codex
 * installed and logged in that they did not have it, and planned around a tool
 * they were never offered.
 *
 * The `.cmd` sibling sitting next to it runs fine. Resolving the real file
 * keeps a shell, and its quoting rules, out of the picture: prompts are passed
 * as arguments and must never be pasted into a command line.
 */
import { existsSync, readFileSync } from "node:fs";
import { delimiter, dirname, extname, join, resolve } from "node:path";

export function findExecutable(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  // Everywhere else, the runtime resolves PATH correctly on its own.
  if (platform !== "win32") return name;

  // PATH is separated by ";" on Windows regardless of what this runtime's own
  // platform uses, since a Windows PATH entry ("C:\...") contains a colon.
  const paths = (env.PATH ?? env.Path ?? "").split(platform === "win32" ? ";" : delimiter);
  const declared = (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD")
    .split(";")
    .map((ext) => ext.trim())
    .filter(Boolean);

  // PATHEXT is conventionally uppercase while the files themselves are usually
  // lowercase. Windows does not care, but a case-sensitive filesystem does, and
  // matching only the declared case means working by accident.
  const extensions = [...new Set(declared.flatMap((ext) => [ext, ext.toLowerCase()]))];

  for (const dir of paths.filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = join(dir, name + extension);
      if (existsSync(candidate)) return candidate;
    }
  }

  return undefined;
}

/** A command and the arguments that must come before the caller's own. */
export interface Launcher {
  command: string;
  prefixArgs: string[];
}

/**
 * How to actually start a command.
 *
 * Finding `codex.cmd` is only half the job: Windows cannot start a batch file
 * through CreateProcess, and Node does not use a shell, so spawning it fails
 * too. Running it *through* a shell would fix that and introduce a worse
 * problem -- the user's idea is passed as an argument, and Node does not quote
 * arguments handed to a shell on Windows, so a sentence containing a quote or
 * an ampersand would be parsed as a command.
 *
 * npm's batch shim is a wrapper around a JavaScript file, and its path is right
 * there in the file. Reading it out and running that script with this very Node
 * skips the shell completely, which keeps arguments as arguments.
 */
export function resolveLauncher(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  nodePath: string = process.execPath,
): Launcher | undefined {
  const found = findExecutable(name, env, platform);
  if (!found) return undefined;

  const isBatch = [".cmd", ".bat"].includes(extname(found).toLowerCase());
  if (!isBatch) return { command: found, prefixArgs: [] };

  const script = scriptInsideNpmShim(found);
  if (script) return { command: nodePath, prefixArgs: [script] };

  // Some other batch file. Better to say we cannot run it than to reach for a
  // shell and hope the arguments survive.
  return undefined;
}

function scriptInsideNpmShim(cmdPath: string): string | undefined {
  let contents: string;
  try {
    contents = readFileSync(cmdPath, "utf8");
  } catch {
    return undefined;
  }

  // e.g.  "%_prog%"  "%dp0%\node_modules\@openai\codex\bin\codex.js" %*
  const match = contents.match(/%dp0%[\\/]?([^"]+?\.[cm]?js)/i);
  if (!match?.[1]) return undefined;

  const script = resolve(dirname(cmdPath), match[1].replace(/\\/g, "/"));
  return existsSync(script) ? script : undefined;
}
