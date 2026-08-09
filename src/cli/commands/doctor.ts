/**
 * `viberaci doctor` -- is this computer ready?
 *
 * Promoted into the MVP by the M0 spike, which found two things a beginner
 * could never diagnose: a Claude Code CLI that had never been logged in on a
 * machine where the desktop app was in daily use, and a Codex sandbox that was
 * simply broken. Both present as an unexplained failure much later.
 *
 * So every line here ends in something to do, never in an error code.
 */
import { spawnSync } from "node:child_process";
import { detectAll } from "../../planner/capabilities.js";
import { dim, heading, ok, problem, say, warn } from "../ui.js";

export function runDoctor(): number {
  heading("Checking your computer");

  let usable = 0;

  for (const tool of detectAll()) {
    if (tool.status === "ready") {
      ok(`${tool.label}: ready`);
      usable++;
    } else if (tool.status === "unknown") {
      // Claude has no free way to test its login, so this stays honest rather
      // than guessing. It counts as usable; a real failure explains itself later.
      ok(`${tool.label}: installed`);
      say(dim(`  ${tool.detail}`));
      usable++;
    } else {
      warn(`${tool.label}: ${tool.detail}`);
      if (tool.fix) say(dim(`  ${tool.fix}`));
    }
  }

  const git = spawnSync("git", ["--version"], { encoding: "utf8", windowsHide: true });
  if (git.error || git.status !== 0) {
    warn("git: not installed. Your project will still work, but nothing will be saved as you go.");
  } else {
    const name = spawnSync("git", ["config", "--get", "user.name"], { encoding: "utf8", windowsHide: true });
    const email = spawnSync("git", ["config", "--get", "user.email"], { encoding: "utf8", windowsHide: true });
    if (name.stdout.trim() && email.stdout.trim()) {
      ok("git: ready");
    } else {
      // Committing fails with a wall of text if git does not know who you are.
      warn("git: installed, but it does not know your name and email yet.");
      say(dim('  git config --global user.name "Your Name"'));
      say(dim('  git config --global user.email "you@example.com"'));
    }
  }

  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 20) ok(`Node ${process.versions.node}: ready`);
  else warn(`Node ${process.versions.node} is older than vibeRACI needs. Install Node 20 or newer.`);

  say();
  if (usable === 0) {
    problem("No AI coding tool is usable, so vibeRACI cannot plan your project properly.");
    say(dim("  Fix one of the warnings above, then run  viberaci doctor  again."));
    say();
    return 1;
  }

  ok("You are ready to build.");
  say(dim('  viberaci init "what you want to build"'));
  say();
  return 0;
}
