/**
 * Starting a git repository for the generated project.
 *
 * Kept deliberately small. vibeRACI initialises a repository and stops -- it
 * does not stage, commit, or touch remotes. Beginners lose work to tools that
 * run git commands they did not understand, and the first commit is a fine
 * thing for a person to make themselves.
 *
 * Every failure here is non-fatal. A project without git still works, and
 * refusing to scaffold because git is missing would be the tail wagging the dog.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export interface GitReport {
  /** Whether `git` could be run at all. */
  available: boolean;
  /** True when this run created the repository. */
  initialised: boolean;
  /** True when the directory was already a repository, so we left it alone. */
  alreadyRepo: boolean;
  /**
   * Whether git knows who the user is. Committing fails without it, with a
   * message beginners find alarming, so `doctor` will want to warn early.
   */
  identityConfigured: boolean;
  problem?: string;
}

function git(args: string[], cwd?: string) {
  return spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
}

export function initGitRepo(targetDir: string): GitReport {
  const report: GitReport = {
    available: false,
    initialised: false,
    alreadyRepo: false,
    identityConfigured: false,
  };

  const version = git(["--version"]);
  if (version.error || version.status !== 0) {
    report.problem = "git is not installed, or not on PATH";
    return report;
  }
  report.available = true;

  const name = git(["config", "--get", "user.name"]);
  const email = git(["config", "--get", "user.email"]);
  report.identityConfigured =
    name.status === 0 &&
    email.status === 0 &&
    name.stdout.trim().length > 0 &&
    email.stdout.trim().length > 0;

  if (existsSync(join(targetDir, ".git"))) {
    report.alreadyRepo = true;
    return report;
  }

  // `-b main` avoids landing the user on whatever default their git version
  // picked, and avoids the rename dance later.
  const init = git(["init", "-b", "main"], targetDir);
  if (init.status !== 0) {
    report.problem = init.stderr.trim() || "git init failed";
    return report;
  }

  report.initialised = true;
  return report;
}
