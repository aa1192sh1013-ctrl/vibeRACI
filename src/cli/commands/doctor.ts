/**
 * `vibecrew doctor` -- is this computer ready?
 *
 * Promoted into the MVP by the M0 spike, which found two things a beginner
 * could never diagnose: a Claude Code CLI that had never been logged in on a
 * machine where the desktop app was in daily use, and a Codex sandbox that was
 * simply broken. Both present as an unexplained failure much later.
 *
 * So every line here ends in something to do, never in an error code.
 */
import { spawnSync } from "node:child_process";
import type { Locale } from "../../core/schema.js";
import { strings } from "../../core/strings.js";
import { detectAll } from "../../planner/capabilities.js";
import { dim, heading, ok, problem, say, warn } from "../ui.js";

export function runDoctor(locale: Locale = "en"): number {
  const s = strings(locale);
  heading(s.checkingComputer);

  let usable = 0;

  for (const tool of detectAll(process.env, locale)) {
    if (tool.status === "ready") {
      ok(s.toolReady(tool.label));
      usable++;
    } else if (tool.status === "unknown") {
      // Claude has no free way to test its login, so this stays honest rather
      // than guessing. It counts as usable; a real failure explains itself later.
      ok(s.toolInstalled(tool.label));
      say(dim(`  ${tool.detail}`));
      usable++;
    } else {
      warn(`${tool.label}: ${tool.detail}`);
      if (tool.fix) say(dim(`  ${tool.fix}`));
    }
  }

  const git = spawnSync("git", ["--version"], { encoding: "utf8", windowsHide: true });
  if (git.error || git.status !== 0) {
    warn(s.gitMissing);
  } else {
    const name = spawnSync("git", ["config", "--get", "user.name"], { encoding: "utf8", windowsHide: true });
    const email = spawnSync("git", ["config", "--get", "user.email"], { encoding: "utf8", windowsHide: true });
    if (name.stdout.trim() && email.stdout.trim()) {
      ok(s.gitReady);
    } else {
      // Committing fails with a wall of text if git does not know who you are.
      warn(s.gitNoIdentity);
      say(dim('  git config --global user.name "Your Name"'));
      say(dim('  git config --global user.email "you@example.com"'));
    }
  }

  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 20) ok(s.nodeReady(process.versions.node));
  else warn(s.nodeTooOld(process.versions.node));

  say();
  if (usable === 0) {
    problem(s.noToolAtAll);
    say(dim(`  ${s.runDoctorAgain}`));
    say();
    return 1;
  }

  ok(s.readyToBuild);
  say(dim(`  ${s.initExample}`));
  say();
  return 0;
}
