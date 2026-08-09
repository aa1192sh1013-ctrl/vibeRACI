import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsePlan } from "../src/core/schema.js";
import { runDone, runUndo } from "../src/cli/commands/done.js";
import { runNext } from "../src/cli/commands/next.js";
import { runStatus } from "../src/cli/commands/status.js";
import { FriendlyError, openProject } from "../src/cli/project.js";
import {
  PROGRESS_PATH,
  currentStep,
  emptyProgress,
  isComplete,
  loadProgress,
  markDone,
  markUndone,
  saveProgress,
  stepStatuses,
} from "../src/progress/progress.js";
import { scaffoldProject } from "../src/scaffold/write.js";

const examplePath = fileURLToPath(new URL("../examples/marketplace.plan.json", import.meta.url));
const raw = JSON.parse(readFileSync(examplePath, "utf8"));
const plan = parsePlan(raw);

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "vibecrew-progress-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Everything the CLI printed during `run`. */
function captured(run: () => void): string {
  const lines: string[] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
    lines.push(args.join(" "));
  });
  try {
    run();
  } finally {
    spy.mockRestore();
  }
  return lines.join("\n");
}

describe("keeping track of where you are", () => {
  it("starts at the first step", () => {
    expect(currentStep(plan, emptyProgress(plan))?.id).toBe("plan-structure");
  });

  it("moves on once a step is ticked off", () => {
    const after = markDone(plan, emptyProgress(plan), "plan-structure");
    expect(currentStep(plan, after)?.id).not.toBe("plan-structure");
  });

  it("follows the plan's order, not the order things were finished", () => {
    let progress = emptyProgress(plan);
    // Tick the last step first; the next thing to do is still the first one.
    progress = markDone(plan, progress, "try-it");
    expect(currentStep(plan, progress)?.id).toBe("plan-structure");
  });

  it("ticking the same step twice changes nothing", () => {
    const once = markDone(plan, emptyProgress(plan), "plan-structure");
    expect(markDone(plan, once, "plan-structure").completed).toEqual(once.completed);
  });

  it("refuses to tick a step that is not in the plan", () => {
    expect(() => markDone(plan, emptyProgress(plan), "invented")).toThrow(/no step called/);
  });

  it("can put a step back", () => {
    const done = markDone(plan, emptyProgress(plan), "plan-structure");
    expect(currentStep(plan, markUndone(done, "plan-structure"))?.id).toBe("plan-structure");
  });

  it("knows when there is nothing left", () => {
    let progress = emptyProgress(plan);
    for (const step of plan.steps) progress = markDone(plan, progress, step.id);
    expect(isComplete(plan, progress)).toBe(true);
    expect(currentStep(plan, progress)).toBeUndefined();
  });

  it("marks exactly one step as current", () => {
    const progress = markDone(plan, emptyProgress(plan), "plan-structure");
    const current = stepStatuses(plan, progress).filter((s) => s.state === "current");
    expect(current).toHaveLength(1);
  });
});

describe("the progress file", () => {
  it("survives a round trip", () => {
    const progress = markDone(plan, emptyProgress(plan), "plan-structure");
    saveProgress(dir, progress);
    expect(loadProgress(dir, plan).completed).toEqual(["plan-structure"]);
  });

  it("starts fresh when there is no file yet", () => {
    expect(loadProgress(dir, plan).completed).toEqual([]);
  });

  it("starts fresh rather than crashing on a damaged file", () => {
    mkdirSync(join(dir, ".vibecrew"), { recursive: true });
    writeFileSync(join(dir, PROGRESS_PATH), "{ this is not json", "utf8");
    expect(() => loadProgress(dir, plan)).not.toThrow();
    expect(loadProgress(dir, plan).completed).toEqual([]);
  });

  it("ignores progress that belonged to a different plan", () => {
    saveProgress(dir, markDone(plan, emptyProgress(plan), "plan-structure"));
    const replanned = parsePlan({
      ...raw,
      meta: { ...raw.meta, createdAt: "2030-01-01T00:00:00.000Z" },
    });
    // Ticks from the old plan must not carry over and hide real work.
    expect(loadProgress(dir, replanned).completed).toEqual([]);
  });

  it("drops steps the plan no longer has", () => {
    saveProgress(dir, { ...emptyProgress(plan), completed: ["plan-structure", "deleted-step"] });
    expect(loadProgress(dir, plan).completed).toEqual(["plan-structure"]);
  });
});

describe("the commands", () => {
  beforeEach(() => {
    scaffoldProject(plan, dir);
  });

  it("refuses politely outside a project, and says how to make one", () => {
    const elsewhere = mkdtempSync(join(tmpdir(), "vibecrew-empty-"));
    try {
      expect(() => openProject(elsewhere)).toThrow(FriendlyError);
      expect(() => openProject(elsewhere)).toThrow(/not a vibecrew project/);
    } finally {
      rmSync(elsewhere, { recursive: true, force: true });
    }
  });

  it("next shows the first step and where its prompt is", () => {
    const out = captured(() => runNext(openProject(dir)));
    expect(out).toContain("Plan the structure");
    expect(out).toContain(".agents/prompts/plan-structure.md");
    expect(out).toContain("vibecrew done");
  });

  it("next names no tool and offers no prompt on the user's own step", () => {
    let project = openProject(dir);
    for (const id of ["plan-structure", "build-backend", "build-ui", "review"]) {
      saveProgress(dir, markDone(plan, project.progress, id));
      project = openProject(dir);
    }
    const out = captured(() => runNext(project));
    expect(out).toContain("Try it yourself");
    expect(out).toContain("This one is yours");
    expect(out).not.toContain("Open Claude Code");
    expect(out).not.toContain(".agents/prompts/");
  });

  it("done ticks off and immediately shows what follows", () => {
    const out = captured(() => runDone(openProject(dir)));
    expect(out).toContain("Plan the structure");
    // The next step appears in the same breath, so nobody has to ask.
    expect(out).toMatch(/Build the (database|screens)/);
    expect(loadProgress(dir, plan).completed).toEqual(["plan-structure"]);
  });

  it("done complains by name about a step that does not exist", () => {
    expect(() => runDone(openProject(dir), "nope")).toThrow(/no step called "nope"/);
  });

  it("undo puts back the step just finished", () => {
    captured(() => runDone(openProject(dir)));
    captured(() => runUndo(openProject(dir)));
    expect(loadProgress(dir, plan).completed).toEqual([]);
  });

  it("undo says so plainly when nothing has been done yet", () => {
    expect(() => runUndo(openProject(dir))).toThrow(/nothing to undo/i);
  });

  it("status shows every step and marks where you are", () => {
    captured(() => runDone(openProject(dir)));
    const out = captured(() => runStatus(openProject(dir)));
    for (const step of plan.steps) expect(out).toContain(step.title);
    expect(out).toContain("[x]");
  });

  it("says the work is finished once every step is ticked", () => {
    let project = openProject(dir);
    for (const step of plan.steps) {
      saveProgress(dir, markDone(plan, project.progress, step.id));
      project = openProject(dir);
    }
    const out = captured(() => runNext(project));
    expect(out).toContain("That is the whole plan");
  });
});
