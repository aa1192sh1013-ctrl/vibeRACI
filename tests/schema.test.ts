import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parsePlan, safeParsePlan } from "../src/core/schema.js";

const examplePath = fileURLToPath(new URL("../examples/marketplace.plan.json", import.meta.url));
const example = JSON.parse(readFileSync(examplePath, "utf8"));

/** A fresh deep copy, so each test can corrupt it without affecting others. */
function plan(): any {
  return JSON.parse(JSON.stringify(example));
}

/** Assert the plan is rejected, and that the message says why in plain terms. */
function expectRejected(p: unknown, matching: RegExp) {
  const result = safeParsePlan(p);
  expect(result.success).toBe(false);
  if (result.success) return;
  const messages = result.error.issues.map((i) => i.message).join("\n");
  expect(messages).toMatch(matching);
}

describe("the bundled example", () => {
  it("is a valid plan", () => {
    expect(() => parsePlan(example)).not.toThrow();
  });

  it("stays within the 2-4 role promise", () => {
    const p = parsePlan(example);
    expect(p.roles.length).toBeGreaterThanOrEqual(2);
    expect(p.roles.length).toBeLessThanOrEqual(4);
  });
});

describe("integrity checks", () => {
  it("rejects two roles owning the same path", () => {
    const p = plan();
    p.ownership.push({ glob: "app/**", roleId: "feature", mode: "owns" });
    expectRejected(p, /owned by both/);
  });

  it("allows two roles to share the same path", () => {
    // `shared/types.ts` is claimed by both ui and feature in the example.
    expect(() => parsePlan(example)).not.toThrow();
  });

  it("rejects a shared path with no explanation", () => {
    const p = plan();
    p.ownership.push({ glob: "config.ts", roleId: "ui", mode: "shared" });
    expectRejected(p, /shared paths must explain/);
  });

  it("rejects ownership pointing at a role that does not exist", () => {
    const p = plan();
    p.ownership.push({ glob: "misc/**", roleId: "ghost", mode: "owns" });
    expectRejected(p, /unknown role "ghost"/);
  });

  it("rejects a step pointing at a role that does not exist", () => {
    const p = plan();
    p.steps[0].roleId = "ghost";
    expectRejected(p, /unknown role "ghost"/);
  });

  it("rejects a role with no step, which the user would never be told to run", () => {
    const p = plan();
    p.steps = p.steps.filter((s: any) => s.roleId !== "reviewer");
    expectRejected(p, /has no step/);
  });

  it("rejects phases with a gap in them", () => {
    const p = plan();
    p.steps[3].phase = 5;
    expectRejected(p, /without gaps/);
  });

  it("rejects an agent step with nobody to carry it out", () => {
    const p = plan();
    p.steps[0].roleId = undefined;
    expectRejected(p, /agent step needs a role/);
  });

  it("rejects putting a teammate's name on the user's own step", () => {
    const p = plan();
    const human = p.steps.find((s: any) => s.kind === "human");
    human.roleId = "reviewer";
    expectRejected(p, /human step belongs to the user/);
  });

  it("rejects a handoff from a step no agent performed", () => {
    const p = plan();
    const human = p.steps.find((s: any) => s.kind === "human");
    human.handoffTo = ["ui"];
    expectRejected(p, /no agent to hand off from/);
  });

  it("treats a step with no kind as agent work", () => {
    const p = plan();
    p.steps[0].kind = undefined;
    const result = safeParsePlan(p);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.steps[0]?.kind).toBe("agent");
  });

  it("rejects a role consulting itself", () => {
    const p = plan();
    p.roles[1].consults = ["ui"];
    expectRejected(p, /cannot consult itself/);
  });

  it("rejects more than five roles outright", () => {
    const p = plan();
    const extra = { ...p.roles[3], id: "extra" };
    p.roles.push(extra, { ...extra, id: "extra-two" });
    expectRejected(p, /at most 5|array must contain at most 5/i);
  });

  it("reports every problem at once rather than stopping at the first", () => {
    const p = plan();
    p.steps[0].roleId = "ghost";
    p.ownership.push({ glob: "misc/**", roleId: "phantom", mode: "owns" });
    const result = safeParsePlan(p);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
  });
});
