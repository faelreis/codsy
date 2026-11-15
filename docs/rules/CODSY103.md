# CODSY103 — Enum without explanation of values

**Default severity**: warn · **Evidence**: strong

## What it checks

That every `enum` in every schema has a non-empty `"description"` explaining what
its values mean.

## Why it matters

Enum values are often short codes. Without an explanation, their meaning is only
in the schema author's head — a reader can't tell "escalation" from "reminder"
means without guessing or asking.

## How to fix

Add a `"description"` to the enum that explains each allowed value, for example:
"small (<50 employees), medium (50-500), large (>500)."
