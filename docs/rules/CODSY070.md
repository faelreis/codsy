# CODSY070 — Insufficient evals

**Default severity**: warn (error with `--strict`) · **Evidence**: strong

## What it checks

That every skill has a matching `evals/<skill>/cases.yaml` with at least the
configured minimum number of cases (`minEvalCases`, default 10).

## Why it matters

`codsy check` only confirms a skill is well-formed. Evals are the only thing that
checks it actually decides correctly — a skill with no cases, or only a couple, has
not really been tested.

## How to fix

Add more cases to `evals/<skill>/cases.yaml`, covering the normal path and every
exception documented in the skill. See
[writing-a-good-skill.md](../writing-a-good-skill.md) for the case format.
