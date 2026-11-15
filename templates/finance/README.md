# Finance operational knowledge (sample)

This repository is a fictional collections example for
[Codsy](https://github.com/faelreis/codsy): schemas (what the business is), skills (what it
knows), context (why), and evals (proof it works). All company and account data here
is made up.

The `collections-classification` skill only classifies overdue accounts and drafts
outreach messages. It never executes a payment.

- `schemas/` — the structured data this business works with.
- `skills/` — the decisions this business makes and the rules behind them.
- `context/` — background that explains why those rules exist.
- `evals/` — real and realistic cases used to check that each skill decides correctly.

Run `codsy check` to find problems. Run `codsy new skill` to add a new decision.
