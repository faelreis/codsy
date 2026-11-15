# CODSY012 — Empty Exceptions section

**Default severity**: warn · **Evidence**: strong

## What it checks

That the Exceptions section has non-whitespace, non-comment content.

## Why it matters

An empty Exceptions section usually means exceptions were never thought through,
not that none exist. Real operational rules almost always have at least one edge
case.

## How to fix

List the cases where the normal decision logic doesn't apply. If you've actually
checked and there truly aren't any yet, write "None known." — that's a real,
checkable claim, unlike a blank section.
