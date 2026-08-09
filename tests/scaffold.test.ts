import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parsePlan, safeParsePlan } from "../src/core/schema.js";
import { planWorkspace } from "../src/scaffold/plan-files.js";
import { ScaffoldConflictError, scaffoldProject } from "../src/scaffold/write.js";

const examplePath = fileURLToPath(new URL("../examples/marketplace.plan.json", import.meta.url));
const raw = JSON.parse(readFileSync(examplePath, "utf8"));
const plan = parsePlan(raw);

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "vibecrew-test-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const read = (p: string) => readFileSync(join(dir, p), "utf8");

describe("what a new project contains", () => {
  it("includes the runbook, the project brief, and the plan itself", () => {
    const paths = planWorkspace(plan).files.map((f) => f.path);
    expect(paths).toContain("START-HERE.md");
    expect(paths).toContain("README.md");
    expect(paths).toContain(".gitignore");
    expect(paths).toContain(".vibecrew/plan.json");
    expect(paths).toContain(".agents/prompts/build-ui.md");
  });

  it("keeps empty owned folders alive so the layout survives a clone", () => {
    const paths = planWorkspace(plan).files.map((f) => f.path);
    // Nothing is generated into server/, but the folder is the visible half of
    // "this belongs to the Feature Developer".
    expect(paths).toContain("server/.gitkeep");
    // .agents/ already has real files, so it needs no placeholder.
    expect(paths).not.toContain(".agents/.gitkeep");
  });

  it("ignores secrets and the local database by default", () => {
    const gitignore = planWorkspace(plan).files.find((f) => f.path === ".gitignore");
    expect(gitignore?.content).toContain(".env");
    expect(gitignore?.content).toContain("node_modules/");
    // The example stack uses better-sqlite3.
    expect(gitignore?.content).toContain("*.db");
  });

  it("saves a plan that can be read back and re-validated", () => {
    const saved = planWorkspace(plan).files.find((f) => f.path === ".vibecrew/plan.json");
    expect(safeParsePlan(JSON.parse(saved?.content ?? "{}")).success).toBe(true);
  });
});

describe("writing to disk", () => {
  it("creates the whole project", () => {
    const report = scaffoldProject(plan, dir);
    expect(report.conflicts).toHaveLength(0);
    expect(report.created.length).toBeGreaterThan(15);
    expect(existsSync(join(dir, "START-HERE.md"))).toBe(true);
    expect(existsSync(join(dir, "server"))).toBe(true);
    expect(read(".agents/prompts/build-ui.md")).toContain("UI Developer");
  });

  it("writes nothing during a dry run", () => {
    const report = scaffoldProject(plan, dir, { dryRun: true });
    expect(report.created.length).toBeGreaterThan(15);
    expect(existsSync(join(dir, "START-HERE.md"))).toBe(false);
  });

  it("reports the same list whether or not it actually writes", () => {
    const dry = scaffoldProject(plan, dir, { dryRun: true });
    const real = scaffoldProject(plan, dir);
    expect(real.created).toEqual(dry.created);
    expect(real.dirsCreated).toEqual(dry.dirsCreated);
  });

  it("does nothing the second time when the plan has not changed", () => {
    scaffoldProject(plan, dir);
    const again = scaffoldProject(plan, dir);
    expect(again.created).toHaveLength(0);
    expect(again.replaced).toHaveLength(0);
    expect(again.unchanged.length).toBeGreaterThan(15);
  });
});

describe("not eating the user's work", () => {
  it("refuses when a file exists with different content", () => {
    writeFileSync(join(dir, "README.md"), "my own notes", "utf8");
    expect(() => scaffoldProject(plan, dir)).toThrow(ScaffoldConflictError);
  });

  it("leaves the directory untouched when it refuses", () => {
    writeFileSync(join(dir, "README.md"), "my own notes", "utf8");
    expect(() => scaffoldProject(plan, dir)).toThrow();
    expect(read("README.md")).toBe("my own notes");
    // The refusal must be all-or-nothing, not "half a project plus an error".
    expect(existsSync(join(dir, "START-HERE.md"))).toBe(false);
    expect(existsSync(join(dir, ".agents"))).toBe(false);
  });

  it("names every conflicting file so the user can decide", () => {
    writeFileSync(join(dir, "README.md"), "mine", "utf8");
    mkdirSync(join(dir, ".agents"), { recursive: true });
    writeFileSync(join(dir, ".agents/ui.md"), "also mine", "utf8");
    try {
      scaffoldProject(plan, dir);
      expect.unreachable("should have refused");
    } catch (error) {
      expect(error).toBeInstanceOf(ScaffoldConflictError);
      const conflicts = (error as ScaffoldConflictError).conflicts;
      expect(conflicts).toContain("README.md");
      expect(conflicts).toContain(".agents/ui.md");
    }
  });

  it("replaces files only when explicitly told to", () => {
    writeFileSync(join(dir, "README.md"), "my own notes", "utf8");
    const report = scaffoldProject(plan, dir, { overwrite: true });
    expect(report.replaced).toEqual(["README.md"]);
    expect(read("README.md")).not.toBe("my own notes");
  });

  it("never deletes a file it did not generate", () => {
    writeFileSync(join(dir, "my-notes.txt"), "keep me", "utf8");
    scaffoldProject(plan, dir, { overwrite: true });
    expect(read("my-notes.txt")).toBe("keep me");
  });
});

describe("paths that try to escape", () => {
  const escaping = ["../evil.txt", "/etc/passwd", "C:\\Windows\\evil.txt", "a/../../b.txt"];

  it.each(escaping)("rejects %s before anything is written", (badPath) => {
    const result = safeParsePlan({
      ...raw,
      scaffold: [...raw.scaffold, { path: badPath, kind: "file", content: "x" }],
    });
    expect(result.success).toBe(false);
  });

  it("still refuses at write time if a bad path ever gets past the schema", () => {
    // Simulates an upstream bug: a plan object that never went through parsing.
    const forged = { ...plan, scaffold: [{ path: "../escaped.txt", kind: "file", content: "x" }] };
    expect(() => scaffoldProject(forged as typeof plan, dir)).toThrow(/outside the project folder/);
  });
});
