# CODSY102 — Too many required fields

**Default severity**: warn · **Evidence**: heuristic

## What it checks

That no `required` array in a schema exceeds the configured limit
(`maxRequiredSchemaFields`, default 8).

## Why it matters

A schema with many required fields is hard to satisfy correctly, and often signals
it's covering more than one real-world concept that should be split apart.

## Why this is a heuristic, not a strong check

Eight is a judgment call, not a derived number. Some legitimately simple schemas
need more than eight required fields (a detailed address format, for example), and
some schemas with only a few required fields are still trying to do too much.
Treat a hit as a prompt to ask whether the schema should be split, not a hard rule.

## How to fix

Split the schema into smaller, more focused schemas, or make some of the required
fields optional if the decision doesn't truly need them every time.
