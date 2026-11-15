# CODSY105 — Eval input fails its schema

**Default severity**: error · **Evidence**: strong

## What it checks

That every eval case's `input`, for a skill that references a schema, actually
validates against that schema.

## Why it matters

An eval case with invalid input isn't actually testing the skill against
realistic data — `codsy eval` would be scoring the model's response to a case that
could never happen in production.

## How to fix

Fix the `input` in the eval case to match the schema's required shape and types,
or update the schema if it no longer reflects reality.
