import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parsePlan } from "../src/core/schema.js";
import { emptyProgress, markDone } from "../src/progress/progress.js";
import { scaffoldProject } from "../src/scaffold/write.js";
import { buildReport, matchesGlob } from "../src/ui/report.js";
import { buildUserPrompt } from "../src/planner/prompt.js";
import type { Answers } from "../src/planner/answers.js";

const examplePath = fileURLToPath(new URL("../examples/marketplace.plan.json", import.meta.url));
const plan = parsePlan(JSON.parse(readFileSync(examplePath, "utf8")));

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "vibesquad-report-"));
  scaffoldProject(plan, dir);
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(relative: string, body = "x\n"): void {
  const target = join(dir, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body, "utf8");
}

const everyStepDone = () => {
  let progress = emptyProgress(plan);
  for (const step of plan.steps) progress = markDone(plan, progress, step.id);
  return progress;
};

describe("deciding which area a file belongs to", () => {
  it("matches everything under a directory", () => {
    expect(matchesGlob("app/page.tsx", "app/**")).toBe(true);
    expect(matchesGlob("app/deep/nested/thing.ts", "app/**")).toBe(true);
    expect(matchesGlob("server/api.ts", "app/**")).toBe(false);
  });

  it("matches a single named file", () => {
    expect(matchesGlob("shared/types.ts", "shared/types.ts")).toBe(true);
    expect(matchesGlob("shared/other.ts", "shared/types.ts")).toBe(false);
  });

  it("keeps a single star inside one segment", () => {
    expect(matchesGlob("routes/auth.js", "routes/*.js")).toBe(true);
    expect(matchesGlob("routes/deep/auth.js", "routes/*.js")).toBe(false);
  });
});

describe("what the report says was built", () => {
  it("lists each teammate's files under their own name", () => {
    write("app/page.tsx");
    write("components/Card.tsx");
    write("server/api.ts");

    const report = buildReport(dir, plan, everyStepDone(), "en");
    const ui = report.roles.find((r) => r.name === "UI Developer");
    const backend = report.roles.find((r) => r.name === "Feature Developer");

    expect(ui?.files).toEqual(["app/page.tsx", "components/Card.tsx"]);
    expect(backend?.files).toEqual(["server/api.ts"]);
  });

  it("says plainly when an area is still empty", () => {
    const report = buildReport(dir, plan, everyStepDone(), "en");
    // Nothing was written anywhere, so every teammate is flagged.
    expect(report.warningLines.length).toBe(plan.roles.length);
    expect(report.allFilledLine).toBeUndefined();
  });

  it("stops warning once every area has something", () => {
    write("app/page.tsx");
    write("components/Card.tsx");
    write("server/api.ts");
    write("db/schema.sql");
    write("docs/plan.md");
    write("tests/app.test.ts");

    const report = buildReport(dir, plan, everyStepDone(), "en");
    expect(report.warningLines).toEqual([]);
    expect(report.allFilledLine).toBeTruthy();
  });

  it("ignores its own bookkeeping when counting files", () => {
    const report = buildReport(dir, plan, everyStepDone(), "en");
    // .agents and .vibesquad are vibesquad's, not the user's work.
    expect(report.filesLine).not.toContain("0");
    const allFiles = report.roles.flatMap((r) => r.files);
    expect(allFiles.some((f) => f.startsWith(".agents/"))).toBe(false);
    expect(allFiles.some((f) => f.startsWith(".vibesquad/"))).toBe(false);
  });

  it("counts the steps actually ticked off", () => {
    const partly = markDone(plan, emptyProgress(plan), plan.steps[0]!.id);
    const report = buildReport(dir, plan, partly, "en");
    expect(report.stepsLine).toContain("1");
    expect(report.stepsLine).toContain(String(plan.steps.length));
  });

  it("speaks the project's language", () => {
    const report = buildReport(dir, plan, everyStepDone(), "ko");
    expect(report.stepsLine).toMatch(/[가-힣]/);
    expect(report.suggestions.every((line) => /[가-힣]/.test(line))).toBe(true);
  });
});

describe("what the report suggests next", () => {
  it("offers a handful, not a backlog", () => {
    const report = buildReport(dir, plan, everyStepDone(), "en");
    expect(report.suggestions.length).toBeGreaterThan(2);
    expect(report.suggestions.length).toBeLessThanOrEqual(5);
  });

  it("suggests tests when there are none, and drops it when there are", () => {
    const without = buildReport(dir, plan, everyStepDone(), "en");
    expect(without.suggestions.join(" ")).toContain("test");

    write("tests/app.test.ts");
    const withTests = buildReport(dir, plan, everyStepDone(), "en");
    expect(withTests.suggestions.join(" ")).not.toContain("write a test");
  });

  it("does not tell someone aiming to deploy to consider deploying", () => {
    const deploying = parsePlan({
      ...JSON.parse(readFileSync(examplePath, "utf8")),
      meta: { ...plan.meta, goal: "deploy" },
    });
    const report = buildReport(dir, deploying, everyStepDone(), "en");
    expect(report.suggestions.join(" ")).not.toContain("Put it online");
  });
});

describe("an attached brief", () => {
  const answers: Answers = {
    idea: "a place to keep recipes",
    goal: "mvp",
    experience: "none",
    tools: ["claude-code"],
    locale: "en",
  };

  it("reaches the planner when there is one", () => {
    const prompt = buildUserPrompt({ ...answers, brief: "Users must be able to scale portions." });
    expect(prompt).toContain("Users must be able to scale portions.");
    expect(prompt).toContain("WRITTEN BRIEF");
  });

  it("adds nothing when there is not", () => {
    expect(buildUserPrompt(answers)).not.toContain("WRITTEN BRIEF");
  });

  it("is ignored when it is only whitespace", () => {
    expect(buildUserPrompt({ ...answers, brief: "   \n  " })).not.toContain("WRITTEN BRIEF");
  });
});
