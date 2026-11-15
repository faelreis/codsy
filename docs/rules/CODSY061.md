# CODSY061 — Prompt injection

**Default severity**: error · **Evidence**: weak

## What it checks

Skill and context files against a list of phrases shaped like instructions aimed
at an AI agent rather than content about the business — "ignore previous
instructions," "reveal your system prompt," and similar.

## Why it matters

Context and skill files are read directly by AI agents. Text written as an
instruction to an agent, rather than a description of the business, can hijack
the agent's behavior when it reads that file as part of its task.

## Why this is weak evidence

This is a small, fixed list of known injection phrasings. It will miss novel
phrasings entirely, and it can flag legitimate business content that happens to
discuss these exact phrases (documentation about prompt injection itself, for
example).

## How to fix

Remove or rephrase the text so it describes the business rather than instructing
an agent — if the content is a deliberate discussion of prompt injection as a
topic, suppress the finding with an inline `<!-- codsy-ignore CODSY061: reason -->`
comment stating why.
