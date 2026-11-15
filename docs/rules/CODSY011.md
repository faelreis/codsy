# CODSY011 — Too few worked examples

**Default severity**: error · **Evidence**: heuristic

## What it checks

That the Examples section has at least the configured minimum number of worked
examples (`minWorkedExamples`, default 2), counted as numbered or bulleted list
items plus subsections.

## Why it matters

Worked examples are the fastest way to check that the decision logic actually
matches real cases, for both a human reviewer and an agent reading the skill.

## Why this is a heuristic, not a strong check

The rule counts list items and subsections, not whether each one is actually a
coherent "input, then decision" example. A skill could satisfy the count with two
list items that aren't real worked examples, or write two genuine examples as plain
prose paragraphs that the counter misses. Treat the count as a floor, not proof the
examples are good.

## How to fix

Add numbered real-world examples, each showing a concrete input and the resulting
decision, for example: "1. A lead with company_size 120 routes to sales."
