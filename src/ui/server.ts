/**
 * The little server behind `vibesquad ui`.
 *
 * It writes files and can spend money on a planning request, so it is locked
 * down rather than left open on a port:
 *
 *  - bound to 127.0.0.1, so nothing off this machine can reach it at all
 *  - every request must carry a secret minted at startup and handed only to
 *    the page we opened, so a website you happen to have in another tab cannot
 *    quietly POST to it
 *  - requests carrying an Origin that is not ours are refused outright
 *
 * Without the secret a malicious page could, in a single fetch, scaffold a
 * project into whatever folder you launched this from.
 */
import { randomBytes } from "node:crypto";
import { type IncomingMessage, type ServerResponse, createServer } from "node:http";
import type { Locale, ToolId } from "../core/schema.js";
import type { Answers } from "../planner/answers.js";
import { createPlan } from "../planner/index.js";
import { detectAll } from "../planner/capabilities.js";
import { markDone, markUndone, saveProgress, loadProgress } from "../progress/progress.js";
import { initGitRepo } from "../scaffold/git.js";
import { scaffoldProject } from "../scaffold/write.js";
import { renderPage } from "./page.js";
import { buildState, readPlan } from "./state.js";

export interface UiServer {
  url: string;
  close: () => Promise<void>;
  port: number;
}

interface Options {
  dir: string;
  locale: Locale;
  port?: number;
}

export async function startUiServer({ dir, locale, port = 0 }: Options): Promise<UiServer> {
  const secret = randomBytes(24).toString("hex");

  const server = createServer((req, res) => {
    handle(req, res, { dir, locale, secret }).catch((error: unknown) => {
      send(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : Number(port);

  return {
    port: actualPort,
    url: `http://127.0.0.1:${actualPort}/?t=${secret}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    // An idea is a sentence. Anything approaching a megabyte is not one.
    if (size > 256 * 1024) throw new Error("that is too long");
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: { dir: string; locale: Locale; secret: string },
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");

  // A browser attaches Origin to cross-site requests. Ours is same-origin, so
  // an Origin that is not our own host is somebody else's page talking to us.
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}`) {
    send(res, 403, { error: "refused" });
    return;
  }

  if (url.searchParams.get("t") !== ctx.secret) {
    send(res, 403, { error: "wrong or missing key -- open the link vibesquad printed" });
    return;
  }

  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(renderPage(ctx.locale, ctx.secret));
    return;
  }

  if (url.pathname === "/api/state" && req.method === "GET") {
    send(res, 200, buildState(ctx.dir, ctx.locale));
    return;
  }

  if (url.pathname === "/api/plan" && req.method === "POST") {
    const body = await readJson(req);
    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    if (idea.length === 0) {
      send(res, 400, { error: "no idea given" });
      return;
    }

    const goal = (["demo", "mvp", "deploy"] as const).includes(body.goal as never)
      ? (body.goal as Answers["goal"])
      : "mvp";

    const found = detectAll(process.env, ctx.locale);
    const tools: ToolId[] = [];
    if (found.find((c) => c.id === "claude-cli")?.status !== "not-installed") tools.push("claude-code");
    if (found.find((c) => c.id === "codex-cli")?.status === "ready") tools.push("codex");

    const result = await createPlan({
      idea,
      goal,
      experience: "none",
      tools: tools.length > 0 ? tools : ["claude-code"],
      locale: ctx.locale,
    });

    scaffoldProject(result.plan, ctx.dir);
    initGitRepo(ctx.dir);

    send(res, 200, { notes: result.notes, state: buildState(ctx.dir, ctx.locale) });
    return;
  }

  if ((url.pathname === "/api/done" || url.pathname === "/api/undo") && req.method === "POST") {
    const plan = readPlan(ctx.dir);
    if (!plan) {
      send(res, 400, { error: "no project here" });
      return;
    }
    const body = await readJson(req);
    const stepId = typeof body.stepId === "string" ? body.stepId : undefined;
    const progress = loadProgress(ctx.dir, plan);

    if (url.pathname === "/api/done") {
      if (!stepId) {
        send(res, 400, { error: "which step?" });
        return;
      }
      saveProgress(ctx.dir, markDone(plan, progress, stepId));
    } else {
      const target = stepId ?? progress.completed.at(-1);
      if (target) saveProgress(ctx.dir, markUndone(progress, target));
    }

    send(res, 200, { state: buildState(ctx.dir, ctx.locale) });
    return;
  }

  send(res, 404, { error: "no such thing" });
}
