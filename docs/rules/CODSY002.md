# CODSY002 — Weak skill description

**Default severity**: warn · **Evidence**: heuristic

## What it checks

That a skill's `description` field exists, is at least 20 characters, and contains
the word "when" somewhere — a cheap proxy for "says when to use the skill."

## Why it matters

An agent decides whether to use a skill from its description alone, before reading
anything else. A description that doesn't say what the skill does and when to use
it means the skill never gets picked when it should, or gets picked when it
shouldn't.

## Why this is a heuristic, not a strong check

Requiring the literal word "when" is a cheap stand-in for "explains the trigger." A
description can satisfy the word check and still be vague ("used when needed"), and
a well-written description that phrases the trigger differently ("triggered by a
new lead arriving") could be flagged unnecessarily. Treat a hit as a prompt to
reread the description, not an automatic rewrite.

## How to fix

Write one or two sentences stating what the skill decides and when an agent should
use it, for example: "Decide whether an inbound lead should be routed to sales, used
when a new lead form submission arrives."
