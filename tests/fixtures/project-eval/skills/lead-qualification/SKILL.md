---
name: lead-qualification
description: Decide whether a lead should be routed to sales, used when a new lead arrives.
metadata:
  owner: sales-ops
  schemas:
    - lead
---

## Purpose

Qualify inbound leads.

## Decision logic

Route leads with company_size 50 or more to sales.
