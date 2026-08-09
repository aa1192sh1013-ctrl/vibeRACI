/**
 * Builds a project from a plan file that already exists.
 *
 *   npm run scaffold -- ./saved-plan.json ./my-project
 *
 * Useful when you have edited a plan by hand, or want the same plan built
 * twice. Re-validates the plan first, so a hand-edited file that broke a rule
 * is caught here rather than halfway through a build.
 */
import { readFileSync } from "node:fs";
import { parsePlan } from "../src/core/schema.js";
import { initGitRepo } from "../src/scaffold/git.js";
import { ScaffoldConflictError, scaffoldProject } from "../src/scaffold/write.js";

const planPath = process.argv[2];
const target = process.argv[3];
if (!planPath || !target) {
  console.error("usage: npm run scaffold -- <plan.json> <folder>");
  process.exit(1);
}

const plan = parsePlan(JSON.parse(readFileSync(planPath, "utf8")));

try {
  const report = scaffoldProject(plan, target);
  console.log(`${report.created.length} files created in ${report.targetDir}`);
  if (report.unchanged.length > 0) console.log(`${report.unchanged.length} already up to date`);

  const git = initGitRepo(report.targetDir);
  if (git.initialised) console.log("git repository started on branch main");
  else if (git.alreadyRepo) console.log("already a git repository, left alone");

  console.log(`\nOpen ${target}/START-HERE.md and follow it.`);
} catch (error) {
  if (error instanceof ScaffoldConflictError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
