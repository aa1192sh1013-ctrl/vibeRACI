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
| M2 | Write a real project scaffold to disk | next |
| M3 | Turn an idea into a plan | |
| M4 | Guided step-by-step runbook commands | |
| M5 | Public release | |

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

## Try the renderer

```bash
npm install
npm test
npm run render:example        # or: npm run render:example -- ko
```

Output lands in `.render-out/`.

## License

MIT
