---
name: ticket-triage
description: Decide how urgently a support ticket needs a response, used when a new ticket is created or an existing one is updated.
metadata:
  owner: support-ops
  last_reviewed: 2026-11-14
  review_every_days: 60
  schemas:
    - ticket
---

## Purpose

Triage incoming support tickets so agents respond to the most urgent ones first.

## When to use

Use this skill whenever a new ticket is created or an existing ticket receives a
new customer reply.

## Input

A ticket record matching the `ticket` schema.

## Decision logic

Mark a ticket `urgent` when `mentions_outage` is `true`, or when `minutes_waiting`
is 30 or more. Otherwise mark it `normal`.

## Exceptions

Tickets with `mentions_outage` `false` and `minutes_waiting` under 30 stay
`normal` even on the `phone` channel, since phone tickets are already answered
live.

## Output

An urgency level of either `urgent` or `normal`.

## Examples

1. A ticket with `mentions_outage` true and `minutes_waiting` 5 is `urgent`,
   because of the outage.
2. A ticket with `mentions_outage` false and `minutes_waiting` 45 is `urgent`,
   because it has waited 30 minutes or more.
3. A ticket with `mentions_outage` false and `minutes_waiting` 10 is `normal`.
