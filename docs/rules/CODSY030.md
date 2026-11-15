# CODSY030 — Vague statement

**Default severity**: warn · **Evidence**: weak

## What it checks

Sentences in Decision logic or Exceptions that contain a vague term from a
dictionary ("when appropriate", "as soon as possible", "large customer", "use good
judgment", "prioritize", extensible via `vagueTermsExtensions`) and have no digit or
backtick-quoted field reference nearby to anchor them to something concrete.

## Why it matters

A rule like "route large customers to senior support when appropriate" cannot be
followed consistently by a human or an agent — it just moves the real decision to
whoever reads it. The concrete version names a number: "route accounts with
annual_revenue_usd over 1,000,000 to senior support within 2 hours."

## Why this is weak evidence

This is a dictionary lookup plus a check for a digit or a backtick, not an
understanding of the sentence. It has two known gaps: it misses spelled-out
numbers ("two hours" instead of "2 hours"), and it doesn't do real schema
cross-referencing — a backtick around any word, not just an actual field name,
satisfies the check. False positives and false negatives are both expected;
`vagueTermsExtensions` lets you tune the dictionary for your own project's jargon.

## How to fix

Replace the vague phrase with a concrete rule: a number, a unit, an enum value, or
a reference to an actual schema field.
