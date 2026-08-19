/**
 * The page, as one string.
 *
 * No framework, no build step, no bundle. The whole interface is a few hundred
 * lines you can read top to bottom, which matters more here than anywhere else
 * in the project: this is the part a beginner sees, and it is the part most
 * likely to be copied by someone learning from the repository.
 *
 * Two rules the design follows. One thing on screen at a time, because a
 * beginner stalls when offered a choice they cannot evaluate. And the page
 * holds no logic: it prints what the server hands it and posts back when a
 * button is pressed, so nothing here can disagree with the command line.
 */
import type { Locale } from "../core/schema.js";
import { strings } from "../core/strings.js";

export function renderPage(locale: Locale, secret: string): string {
  const s = strings(locale);
  const text = {
    title: s.uiTitle,
    subtitle: s.uiSubtitle,
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
    stepOf: s.uiStepOf(1, 2).replace("1", "{n}").replace("2", "{total}"),
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
    counting: s.countingNote,
    setup: {
      heading: s.setupHeading,
      items: [
        [s.setupNode, s.setupNodeHow],
        [s.setupTool, s.setupToolHow],
        [s.setupAccount, s.setupAccountHow],
        [s.setupKeepOpen, s.setupKeepOpenHow],
      ],
    },
    upload: {
      label: s.uploadLabel,
      hint: s.uploadHint,
      chosen: s.uploadChosen("{name}"),
      clear: s.uploadClear,
      tooBig: s.uploadTooBig,
      wrongType: s.uploadWrongType,
    },
    report: {
      open: s.reportOpen,
      title: s.reportTitle,
      intro: s.reportIntro,
      back: s.reportBack,
      builtHeading: s.reportBuiltHeading,
      builtNote: s.reportBuiltNote,
      checkHeading: s.reportCheckHeading,
      nextHeading: s.reportNextHeading,
      nextIntro: s.reportNextIntro,
    },
  };

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(s.uiTitle)} · vibesquad</title>
<style>
  :root {
    --paper: #fbf7f2;
    --card: #ffffff;
    --ink: #191410;
    --muted: #7a6f66;
    --line: #ece3d9;
    --accent: #f0532b;
    --accent-soft: #ffe9e2;
    --accent-ink: #ffffff;
    --deep: #12564a;
    --deep-soft: #dff0ea;
    --warn: #8a5a00;
    --warn-bg: #fdf3dc;
    --shadow: 0 1px 2px rgba(25,20,16,.05), 0 8px 24px -12px rgba(25,20,16,.18);
    --r: 18px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #14110f;
      --card: #1d1916;
      --ink: #f2ece6;
      --muted: #a2968c;
      --line: #302a25;
      --accent: #ff6f4a;
      --accent-soft: #3a201a;
      --accent-ink: #1a0d08;
      --deep: #5bc4ac;
      --deep-soft: #16302b;
      --warn: #e2b35f;
      --warn-bg: #2c2416;
      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 30px -14px rgba(0,0,0,.7);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--ink);
    background: var(--paper);
    background-image:
      radial-gradient(60rem 30rem at 15% -10%, var(--accent-soft), transparent 60%),
      radial-gradient(50rem 26rem at 95% 0%, var(--deep-soft), transparent 55%);
    background-repeat: no-repeat;
    font: 17px/1.65 system-ui, -apple-system, "Segoe UI", "Noto Sans KR", sans-serif;
    padding: 44px 20px 100px;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 660px; margin: 0 auto; }
  h1 {
    font-size: clamp(30px, 6vw, 40px); line-height: 1.15; margin: 0 0 10px;
    letter-spacing: -0.035em; font-weight: 800;
  }
  h2 { font-size: 19px; margin: 0 0 12px; letter-spacing: -0.015em; font-weight: 700; }
  h3 { font-size: 16px; margin: 0 0 4px; font-weight: 700; }
  p { margin: 0 0 14px; }
  .muted { color: var(--muted); }
  .small { font-size: 14.5px; line-height: 1.55; }
  .lede { font-size: 18px; color: var(--muted); margin-bottom: 26px; }

  .card {
    background: var(--card); border: 1px solid var(--line);
    border-radius: var(--r); padding: 26px; margin-bottom: 16px;
    box-shadow: var(--shadow);
  }
  .card.accent { border-color: var(--accent); box-shadow: 0 10px 30px -16px var(--accent); }

  textarea {
    width: 100%; min-height: 130px; padding: 15px; font: inherit; resize: vertical;
    border: 1.5px solid var(--line); border-radius: 12px;
    background: var(--paper); color: var(--ink);
  }
  textarea:focus-visible, button:focus-visible, .goal:focus-visible {
    outline: 3px solid var(--accent); outline-offset: 2px;
  }

  .goals { display: grid; gap: 9px; margin: 8px 0 24px; }
  .goal {
    display: flex; gap: 12px; align-items: center; padding: 14px 16px;
    border: 1.5px solid var(--line); border-radius: 12px; cursor: pointer;
    background: var(--paper); transition: border-color .12s, background .12s;
  }
  .goal:hover { border-color: var(--muted); }
  .goal[aria-checked="true"] { border-color: var(--accent); background: var(--accent-soft); }
  .dot { width: 15px; height: 15px; border-radius: 50%; border: 2px solid var(--muted); flex: none; }
  .goal[aria-checked="true"] .dot { border-color: var(--accent); background: var(--accent); }

  button {
    font: inherit; font-weight: 700; cursor: pointer; border-radius: 12px;
    border: 1.5px solid transparent; padding: 15px 22px; transition: transform .06s, filter .12s;
  }
  button:active { transform: translateY(1px); }
  .primary {
    background: var(--accent); color: var(--accent-ink); width: 100%; font-size: 17.5px;
    box-shadow: 0 6px 18px -8px var(--accent);
  }
  .primary:hover { filter: brightness(1.05); }
  .primary:disabled { opacity: .5; cursor: default; box-shadow: none; }
  .ghost {
    background: transparent; color: var(--muted); border-color: var(--line);
    padding: 11px 16px; font-size: 15px; font-weight: 600;
  }
  .ghost:hover { color: var(--ink); border-color: var(--muted); }

  /* setup guide */
  .guide { list-style: none; margin: 0; padding: 0; counter-reset: g; }
  .guide li {
    display: grid; grid-template-columns: 30px 1fr; gap: 13px;
    padding: 12px 0; border-top: 1px solid var(--line);
  }
  .guide li:first-child { border-top: 0; padding-top: 2px; }
  .guide li::before {
    counter-increment: g; content: counter(g);
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--deep-soft); color: var(--deep);
    font-size: 14px; font-weight: 800;
    display: grid; place-items: center;
  }

  /* teammates */
  .who { display: flex; gap: 13px; align-items: flex-start; padding: 11px 0; }
  .who + .who { border-top: 1px solid var(--line); }
  .badge-emoji {
    width: 40px; height: 40px; border-radius: 13px; flex: none;
    background: var(--accent-soft); display: grid; place-items: center; font-size: 20px;
  }

  /* progress rail */
  .rail { display: flex; gap: 7px; margin: 0 0 20px; }
  .pip { height: 7px; flex: 1; border-radius: 99px; background: var(--line); }
  .pip.done { background: var(--deep); }
  .pip.current { background: var(--accent); }

  ol.steps { list-style: none; padding: 0; margin: 0; }
  ol.steps li {
    display: flex; gap: 11px; padding: 9px 0; align-items: baseline;
    border-top: 1px solid var(--line);
  }
  ol.steps li:first-child { border-top: 0; }
  ol.steps li.done { color: var(--muted); }
  ol.steps li.done .t { text-decoration: line-through; }
  ol.steps li.current { font-weight: 700; }

  .kicker {
    display: inline-block; font-size: 12.5px; font-weight: 800;
    letter-spacing: .1em; text-transform: uppercase;
    color: var(--accent); background: var(--accent-soft);
    padding: 5px 11px; border-radius: 99px; margin-bottom: 12px;
  }

  pre {
    white-space: pre-wrap; word-break: break-word; background: var(--paper);
    border: 1px solid var(--line); border-radius: 12px; padding: 15px;
    max-height: 260px; overflow: auto; font-size: 13.5px; margin: 12px 0 0;
  }
  code { font-size: .92em; }
  details summary { cursor: pointer; }

  ul.checks { list-style: none; padding: 0; margin: 0 0 20px; }
  ul.checks li { padding: 6px 0 6px 28px; position: relative; }
  ul.checks li::before {
    content: ""; position: absolute; left: 0; top: 12px;
    width: 15px; height: 15px; border: 2px solid var(--muted);
    border-radius: 5px;
  }

  ul.plain { list-style: none; padding: 0; margin: 0; }
  ul.plain li { padding: 9px 0; border-top: 1px solid var(--line); }
  ul.plain li:first-child { border-top: 0; }

  .files { font-size: 13.5px; color: var(--muted); margin: 6px 0 0; word-break: break-all; }

  .drop {
    border: 1.5px dashed var(--line); border-radius: 12px; padding: 16px;
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    background: var(--paper);
  }
  .drop.has { border-style: solid; border-color: var(--deep); background: var(--deep-soft); }

  .spin {
    display: inline-block; width: 16px; height: 16px; vertical-align: -3px;
    border: 2.5px solid var(--line); border-top-color: var(--accent);
    border-radius: 50%; animation: t .9s linear infinite;
  }
  @keyframes t { to { transform: rotate(360deg); } }
  .err { background: var(--warn-bg); color: var(--warn); border-radius: 12px; padding: 14px; margin-top: 14px; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<main id="app"><p class="muted"><span class="spin"></span></p></main>
<script>
const T = ${JSON.stringify(text)};
const KEY = ${JSON.stringify(secret)};
const app = document.getElementById("app");
let goal = "mvp";
let brief = null;      // text of an attached document
let briefName = "";

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

function failed(message) {
  app.innerHTML = '<div class="card"><h2>' + esc(T.wrong) + '</h2><p class="muted">' +
    esc(message) + '</p><button class="ghost" onclick="location.reload()">↻</button></div>';
}

/* ── screen 1: setup guide, idea, brief ─────────────────────────── */

function setupCard() {
  const items = T.setup.items.map(([what, how]) =>
    '<li><div><h3>' + esc(what) + '</h3><p class="muted small" style="margin:0">' +
    esc(how) + '</p></div></li>').join("");
  return '<div class="card"><h2>' + esc(T.setup.heading) + '</h2><ol class="guide">' +
    items + '</ol></div>';
}

function briefRow() {
  if (brief === null) {
    return '<div class="drop" id="drop">' +
      '<button class="ghost" id="pick">' + esc(T.upload.label) + '</button>' +
      '<span class="muted small" style="flex:1;min-width:200px">' + esc(T.upload.hint) + '</span>' +
      '</div><input type="file" id="file" accept=".txt,.md,.markdown,text/plain" hidden>';
  }
  return '<div class="drop has" id="drop">' +
    '<span style="flex:1">' + esc(T.upload.chosen.replace("{name}", briefName)) + '</span>' +
    '<button class="ghost" id="unpick">' + esc(T.upload.clear) + '</button>' +
    '</div><input type="file" id="file" accept=".txt,.md,.markdown,text/plain" hidden>';
}

function startScreen(state) {
  const goals = T.goals.map((label, i) => {
    const value = ["demo", "mvp", "deploy"][i];
    return '<div class="goal" role="radio" tabindex="0" data-goal="' + value + '" aria-checked="' +
      (goal === value) + '"><span class="dot"></span><span>' + esc(label) + '</span></div>';
  }).join("");

  app.innerHTML =
    '<h1>' + esc(T.title) + '</h1><p class="lede">' + esc(T.subtitle) + '</p>' +
    setupCard() +
    '<div class="card accent"><h2>' + esc(T.askIdea) + '</h2>' +
    '<p class="muted small">' + esc(T.askIdeaHint) + '</p>' +
    '<textarea id="idea" placeholder="' + esc(T.placeholder) + '"></textarea>' +
    '<div style="margin-top:14px">' + briefRow() + '</div>' +
    '<h2 style="margin-top:26px">' + esc(T.askGoal) + '</h2><div class="goals">' + goals + '</div>' +
    '<button class="primary" id="go">' + esc(T.start) + '</button>' +
    '<p class="muted small" style="margin:16px 0 0">' + esc(T.folder) + ': <code>' +
    esc(state.dir) + '</code></p><div id="err"></div></div>';

  wireGoals();
  wireBrief(state);

  document.getElementById("go").onclick = async () => {
    const idea = document.getElementById("idea").value.trim();
    const err = document.getElementById("err");
    if (!idea) { err.innerHTML = '<div class="err">' + esc(T.needIdea) + '</div>'; return; }
    app.innerHTML = '<h1>' + esc(T.title) + '</h1><div class="card"><p style="margin:0">' +
      '<span class="spin"></span> ' + esc(T.working) + '</p></div>';
    try {
      draw((await api("/api/plan", { idea, goal, brief })).state);
    } catch (e) { failed(e.message); }
  };
}

function wireGoals() {
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
}

function wireBrief(state) {
  const input = document.getElementById("file");
  const pick = document.getElementById("pick");
  const unpick = document.getElementById("unpick");
  const err = document.getElementById("err");

  if (pick) pick.onclick = () => input.click();
  if (unpick) unpick.onclick = () => { brief = null; briefName = ""; startScreen(state); };

  if (input) input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    err.innerHTML = "";
    if (!/\\.(txt|md|markdown)$/i.test(file.name)) {
      err.innerHTML = '<div class="err">' + esc(T.upload.wrongType) + '</div>'; return;
    }
    if (file.size > 100 * 1024) {
      err.innerHTML = '<div class="err">' + esc(T.upload.tooBig) + '</div>'; return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      brief = String(reader.result || "");
      briefName = file.name;
      const idea = document.getElementById("idea").value;
      startScreen(state);
      document.getElementById("idea").value = idea;
    };
    reader.readAsText(file);
  };
}

/* ── screen 2: the plan ─────────────────────────────────────────── */

function projectScreen(state) {
  const p = state.project;

  const rail = p.steps.map((st) => '<span class="pip ' + st.state + '"></span>').join("");
  const who = p.roles.map((r) =>
    '<div class="who"><span class="badge-emoji">' + esc(r.emoji) + '</span>' +
    '<div><h3>' + esc(r.name) + '</h3><p class="muted small" style="margin:0">' +
    esc(r.summary) + '</p></div></div>').join("");
  const steps = p.steps.map((st) =>
    '<li class="' + st.state + '"><span>' + esc(st.emoji) + '</span>' +
    '<span class="t">' + esc(st.title) + '</span></li>').join("");

  let now = "";
  if (p.finished) {
    now = '<div class="card accent"><h2>' + esc(T.finishedTitle) + '</h2>' +
      '<p class="muted">' + esc(T.finishedBody) + '</p>' +
      '<button class="primary" id="report">' + esc(T.report.open) + '</button>' +
      '<div style="margin-top:10px"><button class="ghost" id="undo">' + esc(T.undo) + '</button></div></div>';
  } else if (p.current) {
    const c = p.current;
    const body = c.kind === "human"
      ? '<p class="muted">' + esc(T.yourTurn) + '</p><ul class="checks">' +
        (c.tasks || []).map((t) => '<li>' + esc(t) + '</li>').join("") + '</ul>'
      : '<p class="muted small">' + esc(T.openTool.replace("{tool}", c.tool || "")) + '</p>' +
        '<button class="primary" id="copy">' + esc(T.copy) + '</button>' +
        '<details><summary class="muted small" style="margin-top:14px">' +
        esc(c.promptFile || "") + '</summary><pre>' + esc(c.prompt || "") + '</pre></details>';

    now = '<div class="card accent">' +
      '<span class="kicker">' + esc(T.stepOf.replace("{n}", c.number).replace("{total}", c.total)) + '</span>' +
      '<h2 style="font-size:22px">' + esc(c.emoji) + ' ' + esc(c.title) + '</h2>' +
      '<p>' + esc(c.goal) + '</p>' + body +
      '<h2 style="font-size:16px;margin-top:22px">' + esc(T.doneWhen) + '</h2>' +
      '<ul class="checks">' + c.doneWhen.map((d) => '<li>' + esc(d) + '</li>').join("") + '</ul>' +
      '<button class="primary" id="done">' + esc(T.markDone) + '</button>' +
      (c.number > 1 ? '<div style="margin-top:10px"><button class="ghost" id="undo">' +
        esc(T.undo) + '</button></div>' : '') + '</div>';
  }

  app.innerHTML =
    '<h1>' + esc(p.name) + '</h1><p class="lede">' + esc(p.idea) + '</p>' +
    '<div class="rail">' + rail + '</div>' + now +
    '<div class="card"><h2>' + esc(T.team) + '</h2>' + who + '</div>' +
    '<div class="card"><h2>' + esc(T.plan) + '</h2><ol class="steps">' + steps + '</ol>' +
    '<p class="muted small" style="margin:16px 0 0">' + esc(T.folder) + ': <code>' +
    esc(state.dir) + '</code></p>' +
    '<p class="muted small" style="margin:6px 0 0">' + esc(T.counting) + '</p></div>';

  const copy = document.getElementById("copy");
  if (copy) copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(p.current.prompt || "");
      copy.textContent = T.copied;
    } catch {
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

  const report = document.getElementById("report");
  if (report) report.onclick = async () => {
    report.disabled = true;
    try { reportScreen(await api("/api/report"), state); }
    catch (e) { failed(e.message); }
    window.scrollTo({ top: 0 });
  };
}

/* ── screen 3: the closing report ───────────────────────────────── */

function reportScreen(r, state) {
  const built = r.roles.map((role) =>
    '<div class="who"><span class="badge-emoji">' + esc(role.emoji) + '</span>' +
    '<div style="min-width:0"><h3>' + esc(role.name) + ' <span class="muted small" ' +
    'style="font-weight:500">· ' + esc(role.fileCountLabel) + '</span></h3>' +
    '<p class="muted small" style="margin:0">' + esc(role.summary) + '</p>' +
    (role.files.length ? '<p class="files">' + role.files.map(esc).join(" · ") + '</p>' : '') +
    '</div></div>').join("");

  const checks = [r.stepsLine, r.filesLine]
    .concat(r.warningLines)
    .concat(r.allFilledLine ? [r.allFilledLine] : [])
    .map((line) => '<li>' + esc(line) + '</li>').join("");

  const next = r.suggestions.map((line) => '<li>' + esc(line) + '</li>').join("");

  app.innerHTML =
    '<h1>' + esc(T.report.title) + '</h1><p class="lede">' + esc(T.report.intro) + '</p>' +
    '<div class="card"><h2>' + esc(T.report.builtHeading) + '</h2>' + built +
    '<p class="muted small" style="margin:16px 0 0">' + esc(T.report.builtNote) + '</p></div>' +
    '<div class="card"><h2>' + esc(T.report.checkHeading) + '</h2>' +
    '<ul class="plain">' + checks + '</ul>' +
    '<p style="margin:16px 0 0">' + esc(r.yourTurnLine) + '</p></div>' +
    '<div class="card accent"><h2>' + esc(T.report.nextHeading) + '</h2>' +
    '<p class="muted small">' + esc(T.report.nextIntro) + '</p>' +
    '<ul class="plain">' + next + '</ul></div>' +
    '<button class="ghost" id="back">' + esc(T.report.back) + '</button>';

  document.getElementById("back").onclick = () => { draw(state); window.scrollTo({ top: 0 }); };
}

function draw(state) {
  if (state.hasProject) projectScreen(state);
  else startScreen(state);
}

api("/api/state").then(draw).catch((e) => failed(e.message));
</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
