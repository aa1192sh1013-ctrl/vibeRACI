/**
 * Scaffolds the bundled example plan into a real folder, so you can open the
 * result and use it like a user would.
 *
 *   npm run scaffold:example -- ./my-test-project
 *   npm run scaffold:example -- ./my-test-project ko
 *
 * Writes only into the folder you name, and refuses if files are already there.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Locale, localeSchema, parsePlan } from "../src/core/schema.js";
import { initGitRepo } from "../src/scaffold/git.js";
import { ScaffoldConflictError, scaffoldProject } from "../src/scaffold/write.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const target = process.argv[2];
if (!target) {
  console.error("usage: npm run scaffold:example -- <folder> [en|ko]");
  process.exit(1);
}
const requested = process.argv[3];
const locale: Locale | undefined = requested ? localeSchema.parse(requested) : undefined;

const raw = JSON.parse(readFileSync(join(root, "examples/marketplace.plan.json"), "utf8"));
const plan = parsePlan(locale ? { ...raw, meta: { ...raw.meta, locale } } : raw);

try {
  const report = scaffoldProject(plan, target);
  console.log(`${report.created.length} files created in ${report.targetDir}`);
  if (report.unchanged.length > 0) console.log(`${report.unchanged.length} already up to date`);
  for (const path of report.created) console.log(`  ${path}`);

  const git = initGitRepo(report.targetDir);
  if (git.initialised) console.log("\ngit repository started on branch main");
  else if (git.alreadyRepo) console.log("\nalready a git repository, left alone");
  else console.log(`\ngit skipped: ${git.problem ?? "unavailable"}`);
  if (git.available && !git.identityConfigured) {
    console.log("note: git does not know your name and email yet, so commits will fail");
  }
} catch (error) {
  if (error instanceof ScaffoldConflictError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
