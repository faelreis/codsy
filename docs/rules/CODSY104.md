# CODSY104 — Missing schema reference

**Default severity**: error · **Evidence**: strong

## What it checks

That every schema name listed in a skill's `metadata.schemas` actually exists as
`schemas/<name>.schema.json`.

## Why it matters

A skill that points at a missing schema can't be validated, and will fail at the
exact moment it matters — when [CODSY105](CODSY105.md) tries to check an eval
case's input against it.

## How to fix

Create the missing `schemas/<name>.schema.json` file, or fix the schema name in
the skill's `metadata.schemas` list.
