# CODSY100 — Invalid against the meta-schema

**Default severity**: error · **Evidence**: strong

## What it checks

That every `schemas/*.schema.json` file is valid JSON and validates against the
JSON Schema 2020-12 meta-schema (via Ajv).

## Why it matters

An invalid schema cannot reliably validate anything else, including eval inputs
checked by [CODSY105](CODSY105.md). Everything downstream of a broken schema is
unreliable.

## How to fix

Fix the JSON syntax error, or the schema keyword Ajv reports as invalid, so the
file validates against the JSON Schema 2020-12 meta-schema.
