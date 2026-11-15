---
name: lead-qualification
description: Decide whether an inbound lead should be routed to sales or marketing nurture.
metadata:
  owner: sales-ops
  last_reviewed: 2026-10-01
  review_every_days: 90
  schemas:
    - lead
---

## Purpose

Qualify inbound leads so sales only spends time on leads that are ready to buy.

## When to use

Use this skill whenever a new lead form submission arrives.

## Input

A lead record matching the `lead` schema.

## Decision logic

Route to sales if the lead has a company size of 50 or more employees.

## Exceptions

<!-- codsy-ignore CODSY012: this skill intentionally has no exceptions yet -->

## Output

A routing decision: `sales` or `nurture`.

## Examples

1. A lead with company_size 120 routes to sales.
2. A lead with company_size 5 routes to nurture.
