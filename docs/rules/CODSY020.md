# CODSY020 — Oversized skill body

**Default severity**: warn · **Evidence**: heuristic

## What it checks

That a skill's body, below the frontmatter, stays within the configured line limit
(`maxSkillBodyLines`, default 300).

## Why it matters

A long `SKILL.md` is expensive for both a human and an agent to read in full, and
usually mixes decision logic with background detail that belongs elsewhere.

## Why this is a heuristic, not a strong check

Line count is a proxy for "hard to read in full," not a direct measurement of it. A
skill with long, necessary worked examples could legitimately need more lines than
the default limit; a short skill can still be confusingly written. Treat a hit as a
prompt to look for content that could move out, not an automatic rule that the file
is too long.

## How to fix

Move background detail into a `references/` file next to the skill, and keep
`SKILL.md` focused on the decision itself.
