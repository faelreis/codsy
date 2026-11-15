---
name: good-skill
description: Decide whether a support ticket is urgent, used when a new ticket is created.
metadata:
  owner: support-ops
  last_reviewed: 2026-11-01
  review_every_days: 90
---

## Purpose

Classify incoming support tickets by urgency.

## When to use

Use this skill whenever a new support ticket is created.

## Input

A support ticket with a subject and body.

## Decision logic

Mark a ticket urgent if it mentions an outage.

## Exceptions

Tickets from internal test accounts are never marked urgent.

## Output

An urgency level: `urgent` or `normal`.

## Examples

1. A ticket mentioning "production outage" is urgent.
2. A ticket asking "how do I reset my password" is normal.
