# CODSY001 — Invalid skill frontmatter or name mismatch

**Default severity**: error · **Evidence**: strong

## What it checks

That a `SKILL.md` file's YAML frontmatter parses, has a `name` field, and that
`name` matches the folder the file lives in.

## Why it matters

Tools and agents load a skill by its folder name. A mismatched or broken name
silently breaks that lookup: `codsy new skill` and every rule that resolves a skill
by its folder will fail to find it, or find the wrong one.

## How to fix

Fix the YAML syntax at the top of the file, and make sure `name:` matches the
folder exactly, including case.
