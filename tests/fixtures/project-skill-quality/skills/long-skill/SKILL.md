---
name: long-skill
description: Decide how to route a shipping delay escalation, used when a carrier reports a delay.
---

## Purpose

This skill has a body that runs well past the fixture's configured
line limit, on purpose, so CODSY020 has something real to flag in
the integration fixture. The exact wording here does not matter,
only the total number of lines in the body below the frontmatter.

Padding paragraph one, to add more lines to this body on purpose.

Padding paragraph two, to add more lines to this body on purpose.

## Decision logic

Escalate to logistics if a shipment is delayed by more than one day.
