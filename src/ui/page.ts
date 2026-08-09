/**
 * The page, as one string.
 *
 * No framework, no build step, no bundle. The whole interface is a few hundred
 * lines you can read top to bottom, which matters more here than anywhere else
 * in the project: this is the part a beginner sees, and it is the part most
 * likely to be copied by someone learning from the repository.
 *
 * The one rule the design follows: one thing on screen at a time. A beginner
 * stalls when offered a choice they cannot evaluate, so every screen has a
 * single obvious button and everything else is quiet.
 */
import type { Locale } from "../core/schema.js";
import { strings } from "../core/strings.js";

export function renderPage(locale: Locale, secret: string): string {
  const s = strings(locale);
  const text = {
    title: s.uiTitle,
    subtitle: s.uiSubtitle,
    checking: s.uiCheckingTools,
    toolsOk: s.uiToolsOk,
    toolsBad: s.uiToolsBad,
    askIdea: s.askIdea,
    askIdeaHint: s.askIdeaHint,
    placeholder: s.uiIdeaPlaceholder,
    askGoal: s.askGoal,
    goals: [s.goalDemo, s.goalMvp, s.goalDeploy],
    start: s.uiStartButton,
    working: s.uiWorking,
    needIdea: s.uiNeedIdea,
    team: s.teamHeading,
    plan: s.planHeading,
    stepOf: [s.uiStepOf(1, 2).replace("1", "{n}").replace("2", "{total}")],
    copy: s.uiCopyPrompt,
    copied: s.uiCopied,
    openTool: s.uiOpenTool("{tool}"),
    yourTurn: s.yourTurn,
    doneWhen: s.doneWhen,
    markDone: s.uiMarkDone,
    undo: s.uiUndo,
    finishedTitle: s.uiFinishedTitle,
    finishedBody: s.uiFinishedBody,
    folder: s.uiFolder,
    wrong: s.uiSomethingWentWrong,
  };

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(s.uiTitle)} · vibecrew</title>
<style>
  :root {
    --bg: #f7f6f3; --card: #fff; --ink: #1c1b19; --muted: #6b6862;
    --line: #e4e1db; --accent: #2f6f4e; --accent-ink: #fff;
    --warn: #9a6a00; --warn-bg: #fdf6e3; --ok: #2f6f4e;
    --radius: 14px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #17181a; --card: #1f2124; --ink: #ececea; --muted: #9b9a96;
      --line: #33363b; --accent: #5fbf8d; --accent-ink: #10241a;
      --warn: #e0b25a; --warn-bg: #2b2519;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font: 17px/1.65 system-ui, -apple-system, "Segoe UI", "Noto Sans KR", sans-serif;
    padding: 40px 20px 80px;
  }
  main { max-width: 640px; margin: 0 auto; }
  h1 { font-size: 30px; line-height: 1.25; margin: 0 0 8px; letter-spacing: -0.01em; }
  h2 { font-size: 19px; margin: 0 0 14px; }
  p { margin: 0 0 14px; }
  .muted { color: var(--muted); }
  .small { font-size: 15px; }
  .card {
    background: var(--card); border: 1px solid var(--line);
    border-radius: var(--radius); padding: 24px; margin-bottom: 18px;
  }
  textarea {
    width: 100%; min-height: 110px; padding: 14px; font: inherit; resize: vertical;
    border: 1px solid var(--line); border-radius: 10px;
    background: var(--bg); color: var(--ink);
  }
  textarea:focus, button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .goals { display: grid; gap: 10px; margin: 6px 0 22px; }
  .goal {
    display: flex; gap: 12px; align-items: center; padding: 14px;
    border: 1px solid var(--line); border-radius: 10px; cursor: pointer; background: var(--bg);
  }
  .goal[aria-checked="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--muted); flex: none; }
  .goal[aria-checked="true"] .dot { border-color: var(--accent); background: var(--accent); }
  button {
    font: inherit; font-weight: 600; cursor: pointer; border-radius: 10px;
    border: 1px solid transparent; padding: 15px 22px;
  }
  .primary { background: var(--accent); color: var(--accent-ink); width: 100%; font-size: 18px; }
  .primary:disabled { opacity: .5; cursor: default; }
  .ghost { background: transparent; color: var(--muted); border-color: var(--line); padding: 10px 16px; font-size: 15px; }
  .tool { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; }
  .tick { flex: none; font-weight: 700; }
  .tick.ok { color: var(--ok); }
  .tick.no { color: var(--warn); }
  .fix { background: var(--warn-bg); color: var(--warn); border-radius: 8px; padding: 10px 12px; margin-top: 6px; font-size: 15px; }
  ol.steps { list-style: none; padding: 0; margin: 0; }
  ol.steps li { display: flex; gap: 10px; padding: 7px 0; align-items: baseline; }
  ol.steps li.done { color: var(--muted); text-decoration: line-through; }
  ol.steps li.current { font-weight: 700; }
  .badge { font-size: 14px; color: var(--muted); letter-spacing: .04em; text-transform: uppercase; }
  pre {
    white-space: pre-wrap; word-break: break-word; background: var(--bg);
    border: 1px solid var(--line); border-radius: 10px; padding: 14px;
    max-height: 240px; overflow: auto; font-size: 14px; margin: 0 0 16px;
  }
  ul.checks { list-style: none; padding: 0; margin: 0 0 18px; }
  ul.checks li { padding: 5px 0 5px 26px; position: relative; }
  ul.checks li::before { content: "☐"; position: absolute; left: 0; color: var(--muted); }
  .spin { display: inline-block; width: 15px; height: 15px; border: 2px solid var(--line);
          border-top-color: var(--accent); border-radius: 50%; animation: t 1s linear infinite; }
  @keyframes t { to { transform: rotate(360deg); } }
  .err { background: var(--warn-bg); color: var(--warn); border-radius: 10px; padding: 14px; }
</style>
</head>
<body>
<main id="app"><p class="muted"><span class="spin"></span></p></main>
<script>
const T = ${JSON.stringify(text)};
const KEY = ${JSON.stringify(secret)};
const app = document.getElementById("app");
let goal = "mvp";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, body) {
  const res = await fetch(path + "?t=" + encodeURIComponent(KEY), {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function toolsCard(state) {
  const bad = state.tools.filter((t) => t.status === "not-installed" || t.status === "not-logged-in");
  const rows = state.tools.map((t) => {
    const ok = t.status === "ready" || t.status === "unknown";
    return '<div class="tool"><span class="tick ' + (ok ? "ok" : "no") + '">' + (ok ? "✓" : "!") + '</span>' +
      '<div><div>' + esc(t.label) + '</div>' +
      '<div class="muted small">' + esc(t.detail) + '</div>' +
      (t.fix ? '<div class="fix">' + esc(t.fix) + '</div>' : '') + '</div></div>';
  }).join("");
  return '<div class="card"><h2>' + esc(T.checking) + '</h2>' + rows +
    '<p class="muted small" style="margin-top:12px">' + esc(bad.length && !state.ready ? T.toolsBad : T.toolsOk) + '</p></div>';
}

function startScreen(state) {
  const goals = T.goals.map((label, i) => {
    const value = ["demo", "mvp", "deploy"][i];
    return '<div class="goal" role="radio" tabindex="0" data-goal="' + value + '" aria-checked="' +
      (goal === value) + '"><span class="dot"></span><span>' + esc(label) + '</span></div>';
  }).join("");

  app.innerHTML =
    '<h1>' + esc(T.title) + '</h1><p class="muted">' + esc(T.subtitle) + '</p>' +
    toolsCard(state) +
    '<div class="card"><h2>' + esc(T.askIdea) + '</h2>' +
    '<p class="muted small">' + esc(T.askIdeaHint) + '</p>' +
    '<textarea id="idea" placeholder="' + esc(T.placeholder) + '"></textarea>' +
    '<h2 style="margin-top:22px">' + esc(T.askGoal) + '</h2><div class="goals">' + goals + '</div>' +
    '<button class="primary" id="go">' + esc(T.start) + '</button>' +
    '<p class="muted small" style="margin:14px 0 0">' + esc(T.folder) + ': <code>' + esc(state.dir) + '</code></p>' +
    '<div id="err"></div></div>';

  for (const el of document.querySelectorAll(".goal")) {
    const pick = () => {
      goal = el.dataset.goal;
      for (const other of document.querySelectorAll(".goal")) {
        other.setAttribute("aria-checked", String(other.dataset.goal === goal));
      }
    };
    el.onclick = pick;
    el.onkeydown = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(); } };
  }

  document.getElementById("go").onclick = async () => {
    const idea = document.getElementById("idea").value.trim();
    const err = document.getElementById("err");
    if (!idea) { err.innerHTML = '<div class="err" style="margin-top:14px">' + esc(T.needIdea) + '</div>'; return; }
    app.innerHTML = '<h1>' + esc(T.title) + '</h1><div class="card"><p><span class="spin"></span> ' +
      esc(T.working) + '</p></div>';
    try {
      const out = await api("/api/plan", { idea, goal });
      draw(out.state);
    } catch (e) {
      app.innerHTML = '<div class="card"><h2>' + esc(T.wrong) + '</h2><p class="muted">' +
        esc(e.message) + '</p><button class="ghost" onclick="location.reload()">↻</button></div>';
    }
  };
}

function projectScreen(state) {
  const p = state.project;
  const roles = p.roles.map((r) =>
    '<div class="tool"><span class="tick">' + esc(r.emoji) + '</span><div><div>' + esc(r.name) +
    '</div><div class="muted small">' + esc(r.summary) + '</div></div></div>').join("");

  const steps = p.steps.map((st) =>
    '<li class="' + st.state + '"><span>' + esc(st.emoji) + '</span><span>' + esc(st.title) + '</span></li>').join("");

  let now = '';
  if (p.finished) {
    now = '<div class="card"><h2>' + esc(T.finishedTitle) + '</h2><p class="muted">' +
      esc(T.finishedBody) + '</p><button class="ghost" id="undo">' + esc(T.undo) + '</button></div>';
  } else if (p.current) {
    const c = p.current;
    const label = T.stepOf[0].replace("{n}", c.number).replace("{total}", c.total);
    const body = c.kind === "human"
      ? '<p class="muted">' + esc(T.yourTurn) + '</p><ul class="checks">' +
        (c.tasks || []).map((t) => '<li>' + esc(t) + '</li>').join("") + '</ul>'
      : '<p class="muted small">' + esc(T.openTool.replace("{tool}", c.tool || "")) + '</p>' +
        '<button class="primary" id="copy">' + esc(T.copy) + '</button>' +
        '<details style="margin:14px 0"><summary class="muted small">' + esc(c.promptFile || "") +
        '</summary><pre>' + esc(c.prompt || "") + '</pre></details>';

    now = '<div class="card"><div class="badge">' + esc(label) + '</div>' +
      '<h2 style="margin-top:6px">' + esc(c.emoji) + ' ' + esc(c.title) + '</h2>' +
      '<p>' + esc(c.goal) + '</p>' + body +
      '<h2 style="font-size:16px;margin-top:18px">' + esc(T.doneWhen) + '</h2><ul class="checks">' +
      c.doneWhen.map((d) => '<li>' + esc(d) + '</li>').join("") + '</ul>' +
      '<button class="primary" id="done">' + esc(T.markDone) + '</button>' +
      (c.number > 1 ? '<div style="margin-top:10px"><button class="ghost" id="undo">' + esc(T.undo) + '</button></div>' : '') +
      '</div>';
  }

  app.innerHTML =
    '<h1>' + esc(p.name) + '</h1><p class="muted">' + esc(p.idea) + '</p>' + now +
    '<div class="card"><h2>' + esc(T.team) + '</h2>' + roles + '</div>' +
    '<div class="card"><h2>' + esc(T.plan) + '</h2><ol class="steps">' + steps + '</ol>' +
    '<p class="muted small" style="margin:14px 0 0">' + esc(T.folder) + ': <code>' + esc(state.dir) + '</code></p></div>';

  const copy = document.getElementById("copy");
  if (copy) copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(p.current.prompt || "");
      copy.textContent = T.copied;
    } catch {
      // Clipboard is blocked in some browsers; the prompt is on screen anyway.
      document.querySelector("details").open = true;
    }
  };

  const done = document.getElementById("done");
  if (done) done.onclick = async () => {
    done.disabled = true;
    draw((await api("/api/done", { stepId: p.current.id })).state);
    window.scrollTo({ top: 0 });
  };

  const undo = document.getElementById("undo");
  if (undo) undo.onclick = async () => {
    undo.disabled = true;
    draw((await api("/api/undo", {})).state);
    window.scrollTo({ top: 0 });
  };
}

function draw(state) {
  if (state.hasProject) projectScreen(state);
  else startScreen(state);
}

api("/api/state").then(draw).catch((e) => {
  app.innerHTML = '<div class="card"><h2>' + esc(T.wrong) + '</h2><p class="muted">' + esc(e.message) + '</p></div>';
});
</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
