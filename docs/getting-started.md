# Getting started

## Install

Codsy is a Node.js CLI. You need Node.js 22.12 or newer.

```bash
npx @codsy/cli init
```

`npx` runs the latest version without a permanent install. To install it once for
repeated use:

```bash
npm install --global @codsy/cli
codsy init
```

## Start a project

Run `codsy init` with no flags for a guided setup: it asks which starting point fits
your project (blank, sales, support, or finance) and writes the files for you.

To skip the questions, pass a directory and a template directly:

```bash
codsy init my-project --template sales
```

This creates:

```
my-project/
  codsy.config.yaml      # rule severities and limits for this project
  AGENTS.md               # instructions for AI agents working in this repo
  CODEOWNERS
  schemas/                # the structured data this business works with
  skills/                 # the decisions this business makes
  context/                # background: company, industry, customers, products, operations, strategy
  evals/                  # test cases proving each skill decides correctly
  .github/workflows/codsy.yml
  README.md
```

Every template's example skill and eval cases are fictional sample data, clearly
marked as such in the files themselves.

## Check your project

```bash
codsy check
```

This reads every schema, skill, context file, and eval suite, and reports anything
wrong: a missing section, a vague rule, a secret that slipped in, a schema that
doesn't validate. Each finding names the file, the line, what's wrong, and exactly
how to fix it.

```bash
codsy check --strict          # also fail on warnings, not just errors
codsy check --format json     # machine-readable output
codsy check --format sarif    # for code-scanning tools and the GitHub Action
```

`codsy check` exits with a non-zero status when it finds an error, so it works as a
CI gate as-is — see [the GitHub Action](github-action.md) for the pre-built version of
that CI step.

## Add a skill

```bash
codsy new skill
```

This asks what decision it is, when it happens, what the rules and exceptions are, and
for two real examples, showing a live preview of the file as you answer. It also
creates an empty `evals/<skill>/cases.yaml` stub for you to fill in with real cases.

Every flag the wizard would ask for can be passed directly, for scripting or CI:

```bash
codsy new skill \
  --name order-escalation \
  --owner ops \
  --purpose "Decide whether an order should be escalated" \
  --when-to-use "an order is flagged as delayed" \
  --input "an order record" \
  --decision-logic "escalate orders delayed more than 3 days" \
  --exceptions "none known" \
  --output "a routing decision" \
  --example "a 5-day-delayed order escalates" \
  --example "a 1-day-delayed order does not escalate"
```

`codsy new schema` works the same way, for a new JSON Schema file.

## Prove it's correct

`codsy check` only confirms a skill is well-formed. To check it actually decides
correctly, run it against real cases and a model:

```bash
codsy eval                    # evaluate every skill with eval cases
codsy eval lead-qualification # evaluate just one skill
codsy eval --threshold 0.9    # require 90% accuracy instead of the default 80%
codsy eval --dry-run          # print the prompts without calling a model
```

See [docs/writing-a-good-skill.md](writing-a-good-skill.md) for how eval cases work
and how providers are configured.

## Learn more

- [The Codsy methodology](methodology.md)
- [Writing a good skill](writing-a-good-skill.md)
- [Running a knowledge audit](knowledge-audit.md)
- [Every rule, with its rationale](rules/index.md)
- [The terminal UI](terminal-ui.md)
- [Security model](security.md)
- [FAQ](faq.md)
