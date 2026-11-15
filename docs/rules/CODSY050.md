# CODSY050 — Missing owner or overdue review

**Default severity**: warn · **Evidence**: strong

## What it checks

That a skill's `metadata.owner` is set, and that `metadata.last_reviewed` plus
`metadata.review_every_days` haven't lapsed into overdue.

## Why it matters

Operational knowledge goes stale. Without an owner and a review cadence, nobody
notices when a rule stops matching reality — the threshold that made sense a year
ago, the exception that was fixed months ago and no longer applies.

## How to fix

Add `metadata.owner` to the frontmatter. If the review is overdue, actually review
the skill with its owner, then update `metadata.last_reviewed` to today.
