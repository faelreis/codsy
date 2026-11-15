# FAQ

**Does Codsy make my AI agents smarter?**

No. Codsy doesn't change what an agent can do — it changes what the agent reads.
`codsy check` makes sure the rules an agent reads are complete and unambiguous;
`codsy eval` checks whether a model, given those rules, actually decides the way
you expect. Neither one makes a model more capable than it already is.

**Does `codsy check` guarantee my skills are correct?**

No. Lint checks **form** — is the file complete, well-structured, free of secrets.
Only `codsy eval`, run against real or realistic cases, checks **correctness** —
whether the documented rule actually produces the decision you expect. A skill can
pass every lint rule and still be wrong.

**Why does CODSY030 flag a rule I think is perfectly clear?**

CODSY030 is a dictionary lookup plus a check for a nearby number or backtick
reference, not an understanding of the sentence — see
[its rule page](rules/CODSY030.md) for its documented limitations. If a flagged
sentence is genuinely fine, suppress it with
`<!-- codsy-ignore CODSY030: reason -->` rather than rewriting it to satisfy the
checker.

**Can I turn a rule off?**

Yes. Set its severity to `off` under `severities` in `codsy.config.yaml`, or
suppress one specific instance with an inline
`<!-- codsy-ignore RULE_ID: reason -->` comment — the reason is required.

**What happens to the sample data in the starter templates?**

It's fictional, and marked as such in every file that contains it. Replace it with
your own schemas, skills, context, and eval cases before relying on a template for
real decisions.

**Does `codsy eval` cost money?**

Running it against `provider: anthropic` or `provider: openai-compatible` calls a
real model and is billed by that provider, per their pricing. `provider: command`
runs a local script you control, with no inherent cost from Codsy itself.
`--dry-run` never calls a provider.

**Why didn't `codsy check` catch an obviously wrong business rule?**

Because lint only checks that a rule is well-formed, not that it's correct — see
the first question above. A perfectly-formed, perfectly wrong rule will pass
`codsy check` and only get caught by `codsy eval` against a case that exercises
it, or by a human reviewer.

**Can I use my own model, not Anthropic's or OpenAI's?**

Yes, either through `provider: openai-compatible` with `eval.baseUrl` pointed at
any API that implements the same request shape, or through `provider: command`,
which runs any local script and reads its stdout as the answer.
