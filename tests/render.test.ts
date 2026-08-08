import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parsePlan } from "../src/core/schema.js";
import { renderAll } from "../src/render/index.js";

const examplePath = fileURLToPath(new URL("../examples/marketplace.plan.json", import.meta.url));
const raw = JSON.parse(readFileSync(examplePath, "utf8"));
const plan = parsePlan(raw);

const files = renderAll(plan);
const byPath = new Map(files.map((f) => [f.path, f.content]));
const get = (p: string) => byPath.get(p) ?? "";

describe("the generated file set", () => {
  it("produces the expected files", () => {
    expect(files.map((f) => f.path)).toMatchInlineSnapshot(`
      [
        ".agents/architect.md",
        ".agents/feature.md",
        ".agents/ownership.json",
        ".agents/prompts/build-backend.md",
        ".agents/prompts/build-ui.md",
        ".agents/prompts/plan-structure.md",
        ".agents/prompts/review.md",
        ".agents/reviewer.md",
        ".agents/settings/architect.settings.json",
        ".agents/settings/reviewer.settings.json",
        ".agents/settings/ui.settings.json",
        ".agents/ui.md",
        "AGENTS.md",
        "CLAUDE.md",
        "START-HERE.md",
      ]
    `);
  });

  it("writes one prompt per step and one charter per role", () => {
    const prompts = files.filter((f) => f.path.startsWith(".agents/prompts/"));
    expect(prompts).toHaveLength(plan.steps.length);
    const charters = plan.roles.map((r) => `.agents/${r.id}.md`);
    for (const c of charters) expect(byPath.has(c)).toBe(true);
  });

  it("only emits a settings file for Claude Code roles", () => {
    // `feature` runs on Codex, which has no equivalent settings file.
    expect(byPath.has(".agents/settings/feature.settings.json")).toBe(false);
    expect(byPath.has(".agents/settings/ui.settings.json")).toBe(true);
  });

  it("is deterministic", () => {
    expect(renderAll(plan)).toEqual(files);
  });

  it("never emits an empty file", () => {
    for (const f of files) expect(f.content.trim().length).toBeGreaterThan(0);
  });
});

describe("boundaries reach the agent", () => {
  it("tells the UI developer what it owns", () => {
    expect(get(".agents/ui.md")).toContain("`app/**`");
    expect(get(".agents/ui.md")).toContain("`components/**`");
  });

  it("tells the UI developer to keep out of the database, naming who owns it", () => {
    const charter = get(".agents/ui.md");
    expect(charter).toContain("`db/**`");
    expect(charter).toContain("Feature Developer");
  });

  it("repeats the boundaries in the prompt, since that is all the agent receives", () => {
    const prompt = get(".agents/prompts/build-ui.md");
    expect(prompt).toContain("`app/**`");
    expect(prompt).toContain("`db/**`");
    expect(prompt).toContain("Do not change it yourself.");
  });

  it("tells the agent where to look for context, not only what to avoid", () => {
    // The prompt is all the agent gets; a read-only list that exists only in
    // the charter is a list the agent never sees.
    const prompt = get(".agents/prompts/build-ui.md");
    expect(prompt).toContain("Read these, do not change them");
    expect(prompt).toContain("`docs/**`");
  });

  it("explains what to do with a shared file instead of just forbidding it", () => {
    const prompt = get(".agents/prompts/build-ui.md");
    expect(prompt).toContain("shared/types.ts");
    expect(prompt).toContain("never rewrite what is already there");
  });

  it("turns ownership into deny rules for Claude Code", () => {
    const deny = JSON.parse(get(".agents/settings/ui.settings.json")).permissions.deny;
    expect(deny).toContain("Edit(db/**)");
    expect(deny).toContain("Write(server/**)");
    expect(deny).toContain("Edit(docs/**)");
  });

  it("blocks writing a neighbour's files without blinding the agent to them", () => {
    const deny = JSON.parse(get(".agents/settings/ui.settings.json")).permissions.deny;
    // The UI must read the API contract and the server code to call them right.
    expect(deny).not.toContain("Read(docs/**)");
    expect(deny).not.toContain("Read(server/**)");
    // An explicit `denied` rule still means "do not even look".
    expect(deny).toContain("Read(db/migrations/**)");
  });
});

describe("the runbook", () => {
  const runbook = () => get("START-HERE.md");

  it("lists the steps in the order they should be done", () => {
    const text = runbook();
    const order = ["Plan the structure", "Build the database and login", "Build the screens", "Check the whole thing"];
    const positions = order.map((t) => text.indexOf(t));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("warns against running independent steps at the same time", () => {
    expect(runbook()).toContain("two agents working in the same folder will overwrite each other");
  });

  it("names the tool to open for each step", () => {
    expect(runbook()).toContain("Open Claude Code in this project folder.");
    expect(runbook()).toContain("Open Codex in this project folder.");
  });

  it("keeps RACI vocabulary out of everything the user or agent reads", () => {
    const banned = /\b(responsible|accountable|consulted|informed|RACI|authority scope|orchestrat)/i;
    for (const f of files) {
      // `responsibilities` is fine as a plain English word; the check targets
      // the RACI labels used as jargon.
      const content = f.content.replace(/responsibilit(y|ies)/gi, "");
      expect(content, `${f.path} leaked RACI vocabulary`).not.toMatch(banned);
    }
  });
});

describe("language", () => {
  it("renders framework wording in Korean without touching the plan's own text", () => {
    const korean = parsePlan({ ...raw, meta: { ...raw.meta, locale: "ko" } });
    const out = new Map(renderAll(korean).map((f) => [f.path, f.content]));
    const runbook = out.get("START-HERE.md") ?? "";

    expect(runbook).toContain("내 AI 팀");
    expect(runbook).toContain("진행 순서");
    // Project-specific wording still comes from the plan, untranslated.
    expect(runbook).toContain("Build the screens");
    expect(out.get(".agents/ui.md")).toContain("고치면 안 되는 것");
  });

  it("produces the same file set in either language", () => {
    const korean = parsePlan({ ...raw, meta: { ...raw.meta, locale: "ko" } });
    expect(renderAll(korean).map((f) => f.path)).toEqual(files.map((f) => f.path));
  });
});
