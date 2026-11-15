# Running a knowledge audit

A knowledge audit is a one-time pass over an existing Codsy project to find out how
much of it is actually trustworthy, not just how much of it exists.

## 1. Run the full check

```bash
codsy check --strict --format json > audit.json
```

`--strict` turns on every warning-level rule, including the ones that are easy to
ignore day-to-day: missing owners, overdue reviews, vague rules, oversized skills.
The JSON output is easiest to tally and sort by rule id or file.

## 2. Sort by severity, then by rule

Errors first. A skill with a broken schema reference ([CODSY104](rules/CODSY104.md))
or missing sections ([CODSY010](rules/CODSY010.md)) is not safe to rely on yet,
regardless of how long it's existed. Fix those before anything else.

Among warnings, prioritize the rules with a **strong** evidence label (see
[the rule index](rules/index.md)) — they're checking a verifiable fact, not a
heuristic, so every hit is a real problem worth fixing. Heuristic and weak-evidence
findings (vague terms, similar descriptions, body length) are worth a look but expect
some of them to be false positives; use judgment rather than fixing every single one
mechanically.

## 3. Check staleness, not just structure

```bash
codsy check --strict --format json | jq '[.diagnostics[] | select(.ruleId == "CODSY050")]'
```

CODSY050 catches skills with no owner or an overdue review. An audit is the right time
to actually sit down with each owner and ask: is this rule still how the business
works? A skill that's structurally perfect but describes a process that changed six
months ago is more dangerous than one that's obviously incomplete, because it looks
trustworthy.

## 4. Check eval coverage, then run the evals

```bash
codsy check --strict --format json | jq '[.diagnostics[] | select(.ruleId == "CODSY070")]'
```

A skill with fewer than 10 eval cases hasn't really been tested. Once every skill has
real coverage, actually run `codsy eval` and look at the accuracy per skill, not just
whether it's above threshold — a skill passing at exactly 80% is worth more attention
than one passing at 100%.

## 5. Re-run after each wave of fixes

Lint and eval results are a snapshot, not a one-time stamp. Re-run `codsy check` and
`codsy eval` after each round of fixes, and set up [the GitHub Action](github-action.md)
so future changes can't silently undo an audit's work.
