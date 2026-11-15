---
name: lead-qualification
description: Decide whether an inbound lead should be routed to a senior sales rep or kept in marketing nurture, used when a new lead form submission arrives.
metadata:
  owner: sales-ops
  last_reviewed: 2026-11-14
  review_every_days: 90
  schemas:
    - lead
---

## Purpose

Qualify inbound leads so a senior sales rep only spends time on leads large enough
to justify a multi-month sales cycle.

## When to use

Use this skill whenever a new lead form submission arrives from the website.

## Input

A lead record matching the `lead` schema.

## Decision logic

Route a lead to `sales` when `company_size` is 50 or more employees. Route a lead
to `nurture` when `company_size` is below 50 employees.

## Exceptions

Leads with `has_budget` set to `false` are routed to `nurture` regardless of
`company_size`, since a sales rep's time is wasted on a lead with no approved
budget.

## Output

A routing decision of either `sales` or `nurture`.

## Examples

1. A lead with `company_size` 120 and `has_budget` true routes to `sales`.
2. A lead with `company_size` 8 routes to `nurture`, since it is below the
   50-employee threshold.
3. A lead with `company_size` 200 and `has_budget` false routes to `nurture`,
   because of the budget exception.
