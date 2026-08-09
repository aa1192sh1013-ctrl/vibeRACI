import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parsePlan } from "../src/core/schema.js";
import { loadProgress, markDone, saveProgress } from "../src/progress/progress.js";
import { scaffoldProject } from "../src/scaffold/write.js";
import { startUiServer, type UiServer } from "../src/ui/server.js";
import { type UiState, buildState } from "../src/ui/state.js";

const examplePath = fileURLToPath(new URL("../examples/marketplace.plan.json", import.meta.url));
const plan = parsePlan(JSON.parse(readFileSync(examplePath, "utf8")));

let dir: string;
let server: UiServer;
let base: string;
let secret: string;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "viberaci-ui-"));
  server = await startUiServer({ dir, locale: "en" });
  base = `http://127.0.0.1:${server.port}`;
  secret = new URL(server.url).searchParams.get("t") ?? "";
});

afterEach(async () => {
  await server.close();
  rmSync(dir, { recursive: true, force: true });
});

const get = (path: string, key = secret) => fetch(`${base}${path}?t=${encodeURIComponent(key)}`);
const post = (path: string, body: unknown, init: RequestInit = {}) =>
  fetch(`${base}${path}?t=${encodeURIComponent(secret)}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });

/**
 * `Response.json()` is typed as `unknown`, so say what these endpoints return
 * rather than leaning on `any` -- a test that cannot describe its own subject
 * is not checking much.
 */
async function stateNow(): Promise<UiState> {
  return (await (await get("/api/state")).json()) as UiState;
}

async function postForState(path: string, body: unknown): Promise<UiState> {
  const payload = (await (await post(path, body)).json()) as { state: UiState };
  return payload.state;
}

/** The project half of the state, for tests that have already scaffolded one. */
function project(state: UiState): NonNullable<UiState["project"]> {
  if (!state.project) throw new Error("expected a project in this folder");
  return state.project;
}

describe("keeping the local server to itself", () => {
  it("listens only on the loopback address", () => {
    // Anything else would expose a file-writing endpoint to the network.
    expect(server.url.startsWith("http://127.0.0.1:")).toBe(true);
  });

  it("refuses a request with no key", async () => {
    expect((await fetch(`${base}/api/state`)).status).toBe(403);
  });

  it("refuses a request with the wrong key", async () => {
    expect((await get("/api/state", "guessed")).status).toBe(403);
  });

  it("refuses a POST from another site even with the key", async () => {
    // Without this, a page open in another tab could scaffold into your folder.
    const res = await post("/api/done", { stepId: "x" }, { headers: { origin: "https://evil.example" } });
    expect(res.status).toBe(403);
  });

  it("mints a key long enough not to be guessed", () => {
    expect(secret.length).toBeGreaterThanOrEqual(32);
  });

  it("gives a different key each time it starts", async () => {
    const other = await startUiServer({ dir, locale: "en" });
    try {
      expect(new URL(other.url).searchParams.get("t")).not.toBe(secret);
    } finally {
      await other.close();
    }
  });
});

describe("what the page is told", () => {
  it("reports an empty folder as having no project", async () => {
    const state = await stateNow();
    expect(state.hasProject).toBe(false);
    expect(state.project).toBeUndefined();
    expect(Array.isArray(state.tools)).toBe(true);
  });

  it("serves the page itself with the key", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("<title>");
  });

  it("describes a scaffolded project, with the first step current", async () => {
    scaffoldProject(plan, dir);
    const p = project(await stateNow());
    expect(p.name).toBe(plan.meta.projectName);
    expect(p.steps).toHaveLength(plan.steps.length);
    expect(p.current?.number).toBe(1);
    expect(p.finished).toBe(false);
  });

  it("hands over the prompt text so the copy button has something to copy", async () => {
    scaffoldProject(plan, dir);
    const current = project(await stateNow()).current;
    expect(current?.kind).toBe("agent");
    expect(current?.prompt).toContain("Architect");
    expect(current?.tool).toBe("Claude Code");
  });

  it("offers no prompt on a step the user does themselves", () => {
    scaffoldProject(plan, dir);
    // Walk to the end, where the example plan puts its human step.
    let progress = loadProgress(dir, plan);
    for (const step of plan.steps.slice(0, -1)) {
      progress = markDone(plan, progress, step.id);
    }
    saveProgress(dir, progress);
    const state = buildState(dir, "en");
    expect(state.project?.current?.kind).toBe("human");
    expect(state.project?.current?.prompt).toBeUndefined();
    expect(state.project?.current?.tasks?.length).toBeGreaterThan(0);
  });
});

describe("ticking steps off from the page", () => {
  beforeEach(() => {
    scaffoldProject(plan, dir);
  });

  it("advances to the next step and says so", async () => {
    const first = project(await stateNow()).current;
    const after = await postForState("/api/done", { stepId: first?.id });
    expect(project(after).current?.number).toBe(2);
  });

  it("writes the tick to disk, so the command line agrees", async () => {
    const first = project(await stateNow()).current;
    await post("/api/done", { stepId: first?.id });
    expect(loadProgress(dir, plan).completed).toEqual([first?.id]);
  });

  it("puts a step back when asked", async () => {
    const first = project(await stateNow()).current;
    await post("/api/done", { stepId: first?.id });
    const after = await postForState("/api/undo", {});
    expect(project(after).current?.number).toBe(1);
  });

  it("refuses to plan with nothing to plan from", async () => {
    // Guards against an empty textarea spending a real request.
    const res = await post("/api/plan", { idea: "   " });
    expect(res.status).toBe(400);
  });

  it("answers 404 for anything it does not have", async () => {
    expect((await get("/api/nonsense")).status).toBe(404);
  });
});
