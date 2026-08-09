/**
 * Plans a real project using whatever AI tool this computer actually has, and
 * optionally builds it.
 *
 *   npm run plan -- "an app that tracks which plants I watered" ko
 *   npm run plan -- "..." ko ./my-project
 *
 * With a folder, this is the whole product end to end: a sentence goes in, a
 * working project with a runbook and copy-paste prompts comes out.
 * Makes a real request through your own Claude Code or Codex login.
 */
import { writeFileSync } from "node:fs";
import { localeSchema, type Locale, type ToolId } from "../src/core/schema.js";
import type { Answers } from "../src/planner/answers.js";
import { createPlan, detectAll } from "../src/planner/index.js";
import { initGitRepo } from "../src/scaffold/git.js";
import { scaffoldProject } from "../src/scaffold/write.js";

const idea = process.argv[2];
if (!idea) {
  console.error('usage: npm run plan -- "<your idea>" [en|ko]');
  process.exit(1);
}
const locale: Locale = process.argv[3] ? localeSchema.parse(process.argv[3]) : "en";

console.log("Checking what this computer can do...\n");
const capabilities = detectAll();
for (const tool of capabilities) {
  console.log(`  ${tool.label}: ${tool.status} -- ${tool.detail}`);
  if (tool.fix) console.log(`     fix: ${tool.fix}`);
}

// Plan only for tools that are actually here. Asking the user which ones they
// have gets a confident answer that is often wrong -- see M0, where the desktop
// app was in daily use while its command line had never been logged in.
const available: ToolId[] = [];
if (capabilities.find((c) => c.id === "claude-cli")?.status !== "not-installed") {
  available.push("claude-code");
}
if (capabilities.find((c) => c.id === "codex-cli")?.status === "ready") {
  available.push("codex");
}
if (available.length === 0) {
  console.error("\nNeither Claude Code nor Codex is available, so there is nothing to plan for.");
  process.exit(1);
}
console.log(`\nPlanning for: ${available.join(", ")}`);

const answers: Answers = {
  idea,
  goal: "mvp",
  experience: "none",
  tools: available,
  locale,
};

console.log("\nPlanning...\n");
const started = Date.now();
const result = await createPlan(answers);
const seconds = ((Date.now() - started) / 1000).toFixed(1);

for (const note of result.notes) console.log(`note: ${note}\n`);

console.log(`Planned by ${result.source} in ${seconds}s\n`);
console.log(`Project: ${result.plan.meta.projectName}`);
console.log(`Stack:   ${result.plan.stack.name} -- ${result.plan.stack.why}\n`);

console.log("Team:");
for (const role of result.plan.roles) {
  const owns = result.plan.ownership
    .filter((o) => o.mode === "owns" && o.roleId === role.id)
    .map((o) => o.glob)
    .join(", ");
  console.log(`  ${role.emoji} ${role.displayName} (${role.tool})`);
  console.log(`     ${role.summary}`);
  if (owns) console.log(`     owns: ${owns}`);
}

console.log("\nOrder:");
const phases = [...new Set(result.plan.steps.map((s) => s.phase))].sort((a, b) => a - b);
for (const phase of phases) {
  const steps = result.plan.steps.filter((s) => s.phase === phase);
  const names = steps
    .map((s) => {
      const emoji =
        s.kind === "human" ? "🙋" : (result.plan.roles.find((r) => r.id === s.roleId)?.emoji ?? "");
      return `${emoji} ${s.title}`;
    })
    .join("   |   ");
  console.log(`  ${phase}. ${names}${steps.length > 1 ? "   (independent)" : ""}`);
}

writeFileSync(".plan-out.json", `${JSON.stringify(result.plan, null, 2)}\n`, "utf8");
console.log("\nFull plan written to .plan-out.json");

const target = process.argv[4];
if (target) {
  const report = scaffoldProject(result.plan, target);
  const git = initGitRepo(report.targetDir);
  console.log(`\n${report.created.length} files created in ${report.targetDir}`);
  if (git.initialised) console.log("git repository started on branch main");
  console.log(`\nOpen ${target}/START-HERE.md and follow it.`);
}
