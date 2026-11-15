---
name: lead-qualification
description: Decide whether an inbound lead should be routed to sales or marketing nurture.
metadata:
  owner: sales-ops
  schemas:
    - good
---

## Purpose

Qualify inbound leads so sales only spends time on leads that are ready to buy.

## Decision logic

Route to sales if the lead has a company size of 50 or more employees.
