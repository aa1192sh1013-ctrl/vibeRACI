# Does splitting the work actually help?

vibecrew's premise is that a beginner is better off running a small team of AI
roles than one session. That is a claim, so it was tested. Twice. It has not
held up, and this page says so.

Both trials: Claude Sonnet 5 on each side, identical tools
(`Read,Write,Edit,Glob,Grep`), identical turn budget, agents restricted to
writing files so neither side could run or test anything. One arm got a single
session and the plain idea. The other got the vibecrew prompts in plan order,
each a fresh session that had never seen the others' code.

Measures were fixed before the results were looked at.

## Trial 1 — shared task board, 2 roles

| | one session | vibecrew team |
| --- | --- | --- |
| sessions | 1 | 3 |
| time / cost | 85s / $0.36 | 192s / $0.99 |
| contract drift | 0 | 0 |
| features | all | all |

The task was small enough that one session wrote both sides of every boundary
and so could not disagree with itself. The headline measure could not
discriminate.

## Trial 2 — event booking site, 3 roles

Accounts, seat booking, an organiser view, a real database.

| | one session | vibecrew team |
| --- | --- | --- |
| sessions | 1 | 4 (3 agent, 1 human) |
| time / cost | 289s / $1.36 | 404s / $1.84 |
| routes defined | 14 | 11 |
| contract drift | 0 | 0 |
| broken references | 0 | 0 |
| features (of 10) | 10 | 10 |

Both shipped a working, internally consistent app with every requirement met.

## What this means

**The "a team writes better code" claim has failed twice.** On the measures that
can be checked mechanically, one session did just as well and cost less. Anyone
choosing vibecrew for code quality is choosing it on a promise this project
cannot currently support.

Two things are worth putting next to that.

The cost penalty shrank as the project grew — 2.1x on the small task, 1.35x on
the larger one. Coordination overhead looks roughly fixed while the work scales.
That is a trend across two data points, which is barely a trend.

And the coordination did work. In trial 2 three sessions that never saw each
other's code agreed on all eleven routes, and a feature designed in step 1 was
implemented in step 2 and rendered in step 3 without anyone reconciling them.
Coordination working is not the same as coordination being necessary — the
single session reached the same place without it.

What the team arm produced that the single session did not: `docs/data-model.md`
and `docs/routes.md`, written before any feature existed. And a runbook telling
its owner what to do next.

## What the measurements got wrong

Four false readings across the two trials, each caught by hand:

- A space-separated `--allowedTools` silently corrupted the session's working
  directory. One arm built a perfectly good app into a stray sibling folder and
  reported success. It looked like the model had hallucinated the whole thing.
- A `fetch(` regex missed an arm that wrapped its calls in a helper, reporting
  zero browser calls and four unused routes for working code.
- Express mount prefixes were not composed, so routes under
  `app.use('/organiser', …)` were all counted as undefined — punishing one arm
  for a structure choice.
- A `require(…)` inside a comment was counted as a real import.

Every number above was confirmed by reading the files. An automated measure that
has not been checked against a control is not evidence.

## Reproducing

The harness is not in this repository — it is throwaway scripting around
`claude -p`. The method is the whole thing: same model, same tools, same turn
budget, one arm per approach, measures written down first, and a control run
that proves the harness can produce a positive result before any negative one is
believed.
