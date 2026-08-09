# vibeRACI

**Who does what, for your AI coding team.**

You have an app idea and you have Claude Code or Codex. The hard part is not
getting AI to write code — it already does that well. The hard part is knowing
what to ask for, in what order, and what to do once it says it is finished.

vibeRACI gives you that: a small team of AI roles, a build order, the prompt to
paste at each step, and a runbook that always tells you the next thing to do.
You are never staring at a folder of files wondering what happens now.

It does not write your code. Claude Code and Codex do that, and you drive them —
that part is the point, not a limitation.

**What it does not claim:** that splitting the work produces better code than one
session. That was tested twice and did not hold up — see
[docs/experiments.md](docs/experiments.md) for the numbers, including the ones
that went against it.

```bash
npx viberaci ui       # everything below, in your browser
```

Or from the terminal, if you prefer:

```bash
npx viberaci doctor                        # is this computer ready?
npx viberaci init "a site for my recipes"  # plan it and set it up
npx viberaci next                          # what to do right now
npx viberaci done                          # tick that off, show what is next
```

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
└── .viberaci/plan.json    the plan everything above is rendered from
```

There is a complete sample in [`examples/generated/`](examples/generated) —
committed so you can read the real output without installing anything. Start
with [START-HERE.md](examples/generated/START-HERE.md).

## How it works

`viberaci ui` opens a local page: it checks your computer, takes your idea, and
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

vibeRACI asks whichever coding tool you already installed, so there is usually
nothing to sign up for and nothing to pay:

1. your local `claude` command
2. your local `codex` command
3. `ANTHROPIC_API_KEY`, if you have one
4. rules only — a general plan, and it says so rather than pretending

`viberaci doctor` reports which of these actually work on your machine. It looks
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
