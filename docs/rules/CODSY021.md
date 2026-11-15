# CODSY021 — Highly similar descriptions

**Default severity**: warn · **Evidence**: weak

## What it checks

Pairwise word overlap (Jaccard similarity) between every pair of skill
descriptions, flagging pairs above a configurable threshold
(`descriptionSimilarityThreshold`, default 0.7).

## Why it matters

If an agent can't tell two skills apart from their descriptions, it will pick the
wrong one at least some of the time.

## Why this is weak evidence

Word overlap is a surface-level signal. Two meaningfully different skills that
happen to share a lot of vocabulary ("Decide whether a lead..." / "Decide whether an
account...") can trip the threshold without actually being confusable in practice,
and two genuinely similar skills phrased with different words could slip past it.

## How to fix

Make each description specific about what makes that skill different from the
other — the trigger, the input, or the decision it produces — rather than just the
general shape of the sentence.
