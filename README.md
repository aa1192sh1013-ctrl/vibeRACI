# vibeRACI

**Who does what, for your AI coding team.**

You have an app idea and you have Claude Code or Codex. What you do not have is
any idea how many sessions to open, what to put in each one, or how to stop two
of them from rewriting each other's work.

vibeRACI answers that. You describe what you want to build; it works out a small
team of AI roles, decides which files each one is allowed to touch, puts them in
an order, and writes the prompt you paste into each session.

It does not write your code. Claude Code and Codex do that, and you drive them —
that part is the point, not a limitation.

## Status

Early development. Not usable yet.

| Milestone | What it covers | State |
| --- | --- | --- |
| M0 | Verify the whole idea is technically possible | done |
| M1 | Plan schema and the file renderers | done |
| M2 | Write a real project scaffold to disk | done |
| M3 | Turn an idea into a plan | done |
| M4 | Guided step-by-step runbook commands | done |
| M5 | Public release | next |

## Using it

```bash
viberaci doctor                        # is this computer ready?
viberaci init "a site for my recipes"  # plan it and set it up
viberaci next                          # what to do right now
viberaci done                          # tick that off, show what is next
viberaci status                        # the whole plan and where you are
```

`next` shows one step and one thing to do about it. `next --copy` puts the
prompt straight on your clipboard so you can paste it into Claude Code or Codex.

Steps say who does them. Most are for an agent; some are yours — opening the app
and clicking through it is something no coding agent can do, so the plan hands
those back to you instead of pretending.

Add `--lang ko` to `init` to get the plan and the guidance in Korean.

## How it fits together

One `plan.json` is the single source of truth. Every file a user ever sees is a
deterministic render of it:

```
idea ──► plan.json ──┬──► START-HERE.md          the human's runbook
                     ├──► CLAUDE.md / AGENTS.md  shared project brief
                     ├──► .agents/<role>.md      one role's standing brief
                     ├──► .agents/prompts/*.md   what you copy and paste
                     └──► .agents/settings/*     optional hard limits
```

## Try it

```bash
npm install
npm test
```

See the generated files on their own:

```bash
npm run render:example              # or: npm run render:example -- ko
```

Or build a whole example project you can open and work in:

```bash
npm run scaffold:example -- ./my-test-project ko
```

Scaffolding only ever writes inside the folder you name. It never deletes
anything, refuses rather than overwriting a file you changed, and does nothing
at all on a second run when the plan has not changed.

Or go end to end from an idea, using whichever AI tool your machine has:

```bash
npm run plan -- "a site where neighbours give away things they no longer need" ko ./giveaway
```

You need Claude Code or Codex installed and logged in, or an
`ANTHROPIC_API_KEY`. With none of them it still builds a project, from rules
rather than from your idea, and tells you that is what happened.

## License

MIT
