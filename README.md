# vibesquad

**Who does what, for your AI coding team.**

You have an app idea and you have Claude Code or Codex. The hard part is not
getting AI to write code — it already does that well. The hard part is knowing
what to ask for, in what order, and what to do once it says it is finished.

vibesquad gives you that: a small team of AI roles, a build order, the prompt to
paste at each step, and a runbook that always tells you the next thing to do.
You are never staring at a folder of files wondering what happens now.

It does not write your code. Claude Code and Codex do that, and you drive them —
that part is the point, not a limitation.

**What it does not claim:** that splitting the work produces better code than one
session. That was tested twice and did not hold up — see
[docs/experiments.md](docs/experiments.md) for the numbers, including the ones
that went against it.

Make an empty folder, open a terminal in it, and run:

```bash
npx vibesquad ui       # everything below, in your browser
```

Or stay in the terminal, if you prefer:

```bash
npx vibesquad doctor                        # is this computer ready?
npx vibesquad init "a site for my recipes"  # plan it and set it up
npx vibesquad next                          # what to do right now
npx vibesquad done                          # tick that off, show what is next
```

## Before you start

**You need Node.js 20 or newer.** `npx` comes with it, so without Node the
commands above do not exist at all. Check by running:

```bash
node -v
```

If that prints something like `v22.14.0`, you are set. If it says the command
is not found, install Node from [nodejs.org](https://nodejs.org) — take the
version it offers you — then **close your terminal and open a new one**, or it
will keep saying the command is not found.

### If `npx` is not found but Node is

Some Windows installs end up with `node` on the path and `npx` not. Check
whether npm made it:

```bash
npm -v
```

If that works, install vibesquad once and skip `npx` entirely:

```bash
npm install -g vibesquad
vibesquad ui
```

Every command below then drops its `npx` prefix — `vibesquad doctor`,
`vibesquad next`, and so on. It also starts faster, since nothing is downloaded
each time.

If `npm -v` fails too, the Node install is incomplete: install it again from
[nodejs.org](https://nodejs.org) and reopen the terminal.

Everything else, `vibesquad doctor` checks for you and tells you how to fix.
You do not have to work it out in advance:

- **Claude Code or Codex**, in their command-line form and signed in. Without
  one you still get a project, but the plan will be a general one rather than
  one about your idea — and vibesquad says so rather than pretending.
- **git**, optional. Without it your project still works; you just have no
  undo.

Any folder you can write to is fine — desktop, documents, anywhere. It only has
to be **empty**: vibesquad refuses to write over files it did not create.

## What you get

`init` writes a real project folder:

```
my-project/
├── START-HERE.md          your build order, in plain language
├── CLAUDE.md              what every agent should know
├── AGENTS.md              the same, for Codex
├── .agents/
│   ├── ui.md              one role's standing brief
│   ├── prompts/*.md       what you copy and paste
│   ├── settings/*.json    optional hard limits for Claude Code
│   └── ownership.json     who owns which files
└── .vibesquad/plan.json    the plan everything above is rendered from
```

There is a complete sample in [`examples/generated/`](examples/generated) —
committed so you can read the real output without installing anything. Start
with [START-HERE.md](examples/generated/START-HERE.md).

## How it works

`vibesquad ui` opens a local page: it checks your computer, takes your idea, and
then shows one step at a time with a button that copies the prompt. Nothing
leaves your machine — the page is served on 127.0.0.1, needs a key printed in
your terminal, and refuses requests from anywhere else.

In the terminal, `next` shows the same one step and one thing to do about it.
`next --copy` puts the prompt straight on your clipboard.

Steps say who does them. Most are for an agent; some are yours — opening the app
and clicking through it is something no coding agent can do, so the plan hands
those back to you instead of pretending otherwise.

Language follows your operating system. `--lang ko` forces Korean.

One `plan.json` is the single source of truth. Every file a user sees is a
deterministic render of it:

```
idea ──► plan.json ──┬──► START-HERE.md          the human's runbook
                     ├──► CLAUDE.md / AGENTS.md  shared project brief
                     ├──► .agents/<role>.md      one role's standing brief
                     ├──► .agents/prompts/*.md   what you copy and paste
                     └──► .agents/settings/*     optional hard limits
```

The plan is validated before anything is written: at most five roles, no two
roles owning the same path, shared paths that explain themselves, no role
without a step, no work assigned to a tool you do not have.

## Planning without an API key

vibesquad asks whichever coding tool you already installed, so there is usually
nothing to sign up for and nothing to pay:

1. your local `claude` command
2. your local `codex` command
3. `ANTHROPIC_API_KEY`, if you have one
4. rules only — a general plan, and it says so rather than pretending

`vibesquad doctor` reports which of these actually work on your machine. It looks
rather than asking, because "do you have Claude Code?" gets a confident yes from
people whose command line has never been logged in.

## Status

Early but usable. Milestones M0–M5 are done; see the git history for what each
one settled and what it got wrong first.

What you can rely on today: a plan that validates before anything is written, a
folder you can start working in, a prompt for every step, design notes written
before the features, and a command that always answers "what now?".

What is unproven: that any of this makes the resulting code better than one
long session would have. [docs/experiments.md](docs/experiments.md) has both
trials, including the parts that argue against this tool.

Not built yet: analysing an existing repository, automatic handoffs between
agents, conflict detection, and the environment setup wizard.

## Development

```bash
npm install
npm test
npm run build

npm run render:example       # regenerate examples/generated (should be no diff)
npm run plan -- "an idea"    # real planning run against your own tools
```

No runtime dependencies beyond `zod`. Argument parsing, colour, prompting,
clipboard access and the browser page are all small enough to read in place.

### Releasing

```bash
npm version 0.2.0
git push --follow-tags
```

The tag starts [`.github/workflows/publish.yml`](.github/workflows/publish.yml),
which publishes through npm's trusted publishing. There is no token anywhere:
GitHub proves to npm which workflow is running, and npm decides whether to
believe it.

## License

MIT
