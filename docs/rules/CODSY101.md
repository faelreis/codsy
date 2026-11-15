# CODSY101 — Property without description

**Default severity**: warn · **Evidence**: strong

## What it checks

That every property in every schema, at every nesting level, has a non-empty
`"description"`.

## Why it matters

A property with no description leaves both humans and agents guessing at what the
field actually means, especially for abbreviated or ambiguous field names.

## How to fix

Add a `"description"` to the property explaining what it means, in plain language.
