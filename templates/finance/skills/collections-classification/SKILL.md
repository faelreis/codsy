---
name: collections-classification
description: Classify an overdue account into a collections stage and draft the next outreach message, used when an invoice becomes overdue. This skill only classifies and drafts; it never executes a payment.
metadata:
  owner: finance-ops
  last_reviewed: 2026-11-14
  review_every_days: 60
  schemas:
    - account
---

## Purpose

Classify overdue accounts consistently so collections outreach escalates in the
right order, without ever taking payment action itself.

## When to use

Use this skill whenever an invoice becomes overdue or an overdue account's
status changes.

## Input

An account record matching the `account` schema.

## Decision logic

Classify an account as `reminder` when `days_overdue` is 1 to 30. Classify it as
`escalation` when `days_overdue` is 31 to 60. Classify it as `final-notice` when
`days_overdue` is 61 or more.

## Exceptions

Accounts with `has_payment_plan` set to `true` stay classified as `reminder`
regardless of `days_overdue`, since they already have an agreed path to pay.

## Output

A collections stage of `reminder`, `escalation`, or `final-notice`, plus a
drafted outreach message for a human to review. This skill never initiates,
approves, or executes a payment.

## Examples

1. An account with `days_overdue` 10 is `reminder`.
2. An account with `days_overdue` 75 and `has_payment_plan` false is
   `final-notice`.
3. An account with `days_overdue` 90 and `has_payment_plan` true stays
   `reminder`, because of the payment-plan exception.
