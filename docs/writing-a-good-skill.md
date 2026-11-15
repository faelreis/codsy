# Writing a good skill

A skill is one decision your business makes, written down well enough that a new hire
or an AI agent could make the same call without asking anyone.

## The required sections

Every `SKILL.md` needs these sections, in this order ([CODSY010](rules/CODSY010.md)):

- **Purpose** — what decision this is and why it matters.
- **When to use** — the trigger. What has to happen before this skill applies.
- **Input** — what information the decision needs, usually a schema reference.
- **Decision logic** — the actual rules, as specific as you can make them.
- **Exceptions** — the cases where the normal rule doesn't apply.
- **Output** — what the decision produces.
- **Examples** — at least two real, worked examples ([CODSY011](rules/CODSY011.md)).

## Be concrete, not vague

The single most common problem Codsy finds is a rule that reads fine but can't
actually be followed consistently:

> Route large customers to senior support when appropriate.

Neither "large" nor "when appropriate" means anything a human or an agent can act on
without guessing. The same rule, written so two different people would make the same
call:

> Route accounts with annual_revenue_usd over 1,000,000 to senior support within 2
> hours of the ticket being opened.

[CODSY030](rules/CODSY030.md) flags sentences like the first one automatically — a
vague term with no number, unit, enum value, or schema field reference nearby.

## Exceptions are not optional

If your Decision logic section has a flat rule with zero exceptions, that's usually a
sign the exceptions were never thought through, not that none exist
([CODSY012](rules/CODSY012.md)). Write "None known." if you've actually checked and
there truly aren't any yet — that's a real, checkable claim; a blank section isn't.

## Give it an owner and keep it fresh

Every skill needs `metadata.owner` and a `metadata.review_every_days`
([CODSY050](rules/CODSY050.md)). Operational rules go stale — a threshold that made
sense a year ago might not today — and without an owner, nobody is on the hook to
notice.

## Prove it with evals, not just lint

`codsy check` can tell you a skill is well-formed. It cannot tell you the skill
actually makes the right call. That's what `evals/<skill>/cases.yaml` is for:

```yaml
skill: lead-qualification
cases:
  - id: large-with-budget
    source: synthetic
    input:
      company_size: 120
      has_budget: true
    expected:
      decision: sales
  - id: small-company
    source: historical
    input:
      company_size: 8
      has_budget: true
    expected:
      decision: nurture
```

`source: historical` means the case came from a real past decision; `source:
synthetic` means you made it up to cover an edge case. Aim for at least 10 cases per
skill ([CODSY070](rules/CODSY070.md)) covering the normal path and every exception you
wrote down.

Run `codsy eval <skill>` to send each case's input, the skill's own text, its
referenced schemas, and your context files to a configured model provider, and check
whether the model's answer matches every field you declared in `expected`. A case
passes only if every declared field matches exactly — the model can return extra
fields, but it can't get a declared one wrong.

Configure which provider `codsy eval` uses in `codsy.config.yaml`:

```yaml
eval:
  provider: anthropic # or "command", or "openai-compatible"
  model: claude-x # the specific model name you want to use
  threshold: 0.8
```

`provider: command` runs a local command of your choice, writing the prompt to its
stdin and reading its stdout as the answer — useful for a custom script or an
internally hosted model with no standard API.

## Keep the body short

If a `SKILL.md` body runs past 300 lines ([CODSY020](rules/CODSY020.md)), that's
usually background detail that belongs in a `references/` file alongside the skill,
not in the file an agent has to read in full every time.

## One decision per skill

If two skills have nearly identical descriptions ([CODSY021](rules/CODSY021.md)), an
agent can't reliably tell which one applies. Either merge them or make the
descriptions specific about what's actually different.
