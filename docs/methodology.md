# The Codsy methodology

Codsy is a method, and a tool that supports it, for writing down how a company makes its
recurring decisions, in a form that people and AI agents can both read, review, and test.

This page explains the thinking behind it: the problem it addresses, who it is for, the
principles it is built on, and how a team actually works with it day to day. For the
commands themselves, see [Getting started](getting-started.md).

## In one paragraph

Every business runs on decisions it makes over and over: which lead goes to sales, which
ticket is urgent, which overdue invoice gets a reminder and which gets a phone call. Most of
those rules live in people's heads, in old chat threads, or in documents nobody trusts
anymore. Codsy asks you to write each of those decisions as a small text file, keep it next
to the data it depends on and the reasons behind it, review changes the way software teams
review code, and prove with real test cases that the written rule still produces the right
answer. The result is operational knowledge that is explicit, owned, versioned, and
checkable, whether the reader is a new hire or an AI agent.

## The problem

### Know-how that only exists in people

A company's most important rules are often the least written down. "Big accounts go to
senior support" works while the person who wrote it is around to explain what "big" means.
When that person changes roles, goes on vacation, or leaves, the rule quietly changes with
whoever inherits it.

### Documentation that cannot be trusted

When rules are written down, they usually end up in wikis and slide decks that share three
weaknesses:

- **No owner.** Nobody is responsible for keeping a page correct, so nobody notices when it
  stops being true.
- **No history.** It is hard to tell who changed a rule, when, and why.
- **No proof.** There is no way to check that the written rule matches what the business
  actually does.

A document that looks complete but describes how things worked a year ago is more dangerous
than an obviously empty one, because people act on it.

### AI agents raise the stakes

AI agents can now take on real operational work: triaging tickets, qualifying leads,
drafting collection notices. An agent follows what it reads. If the instructions are vague
("prioritize important customers"), it will guess, and it will guess differently from a
person, and sometimes differently from one run to the next. If the instructions contain a
pasted API key or a customer's phone number, the agent now has them too.

Giving agents access to company knowledge makes the quality of that knowledge a direct
operational risk, not a documentation nicety.

## The proposal

Codsy treats operational knowledge the way good engineering teams treat code:

| Software practice | Codsy equivalent                                                    |
| ----------------- | ------------------------------------------------------------------- |
| Source files      | Small text files, one decision each                                 |
| Types             | Schemas describing the data each decision reads                     |
| Comments and docs | Context files explaining why the rules exist                        |
| Tests             | Eval cases: inputs paired with the decision they should produce     |
| Linter            | `codsy check`: catches incomplete, vague, or unsafe files           |
| Code review       | Pull requests, with an owner who must approve changes to their area |
| Continuous checks | A GitHub Action that checks every proposed change automatically     |

None of these practices are new. What Codsy contributes is a specific shape for business
knowledge, a set of rules that encode what "well written" means for that shape, and a way
to run the whole loop without needing to be a developer.

## Who it is for

Codsy is designed for three kinds of people, and every part of it has to work for all of
them.

### People who run the business

Founders, executives, and department heads who want the company's key decisions to be
explicit, consistent, and auditable.

- **What they get:** a single place where the rules the business runs on are written in
  plain language, with an owner and a review date on each one.
- **What they need to do:** nothing technical. They can read and edit files in the browser
  on GitHub, open a pull request, and read a plain-language comment that says what, if
  anything, needs fixing.

### People who own a process

Sales operations, support leads, finance managers, operations analysts: the people who
actually know how a decision is made and are accountable for it.

- **What they get:** a guided way to turn what they know into a well-structured file, with
  immediate feedback on what is missing or unclear.
- **What they need to do:** answer plain questions ("what is the decision, when does it
  happen, what are the rules, what are the exceptions, give two real examples") and keep
  their skills reviewed.

### Developers and AI engineers

The people who connect AI agents and automation to company knowledge.

- **What they get:** structured, validated files with a predictable format, a configurable
  rule engine, machine-readable output (JSON, SARIF), a CI integration, and an evaluation
  harness that works with the model provider of their choice.
- **What they need to do:** wire the files into their agents, set up the checks in CI, and
  extend or tune the rules for their organization.

## The four building blocks

A Codsy project is a folder, usually a Git repository, with four kinds of files.

```
schemas/    what the business is
skills/     what the business knows
context/    why it works this way
evals/      proof that it works
```

### Schemas: what the business is

A schema describes the data a decision reads: a lead, a support ticket, an invoice. Schemas
are written in JSON Schema, an open standard, and every field is expected to carry a
plain-language description.

Schemas matter because they give rules something precise to point at. "Large company" is
an opinion; `company_size` of 50 or more is a fact that can be checked.

### Skills: what the business knows

A skill is one decision, written down well enough that a new hire or an AI agent could make
the same call without asking anyone. Each skill is a `SKILL.md` file with a short header
(name, description, owner, review cadence, schemas it uses) and seven sections, always in
this order:

1. **Purpose**: what the decision is and why it matters.
2. **When to use**: the trigger, meaning what has to happen before this skill applies.
3. **Input**: the information the decision needs, usually a schema.
4. **Decision logic**: the rules, as specific as possible.
5. **Exceptions**: the cases where the normal rule does not apply.
6. **Output**: what the decision produces.
7. **Examples**: at least two worked examples.

The format follows the open Agent Skills convention, so the same files can be loaded by AI
agents that support it without conversion.

### Context: why it works this way

Context files hold the background a rule depends on: the company, its industry, customers,
products, operations, and strategy. They are what lets a reader, human or agent, handle a
situation the rules did not anticipate in the spirit the rules were written.

### Evals: proof that it works

An eval is a list of test cases for one skill. Each case has an input (a realistic record)
and the decision that input should produce. A case is marked `historical` when it comes from
a real past decision and `synthetic` when it was written to cover an edge case.

Evals are the only part of the method that answers the question "is this rule right?", as
opposed to "is this rule well written?"

## Principles

These are the ideas the rest of the method follows from.

### 1. One decision per file

A skill describes one decision. Small, focused files are easier to read, review, own, and
test, and an agent can tell which one applies. If two skills sound nearly the same, either
they should be merged or their descriptions should say what is different.

### 2. Concrete over vague

A rule is good when two different people reading it would make the same call. "Route large
customers to senior support when appropriate" fails that test. "Route accounts with
`annual_revenue_usd` over 1,000,000 to senior support within 2 hours" passes it. Codsy flags
vague phrases that are not anchored to a number, unit, allowed value, or schema field.

### 3. Exceptions are part of the rule

Real decisions have exceptions, and they are where mistakes happen. An empty Exceptions
section usually means nobody thought them through, not that there are none. Writing "None
known" is acceptable: it is an explicit, reviewable claim. A blank section is not.

### 4. Every rule has an owner and an expiry date

Each skill names an owner and how often it must be reviewed. Rules go stale: a threshold
that made sense last year may not today. Without an owner, nobody notices; without a review
date, nobody is asked.

### 5. Form and correctness are different questions

Codsy keeps two checks strictly apart:

- **Form** (`codsy check`): is the file complete, consistent, specific, and free of secrets?
  This runs offline, instantly, and for free.
- **Correctness** (`codsy eval`): given this file, does a model actually make the decision
  the test cases expect? This calls a model and is the only way to catch a rule that is
  well written but wrong.

A skill can pass every form check and still be wrong. Codsy never presents a clean check as
proof of correctness.

### 6. Changes are reviewed, not just saved

Knowledge files live in version control. Every change is a pull request with a visible
diff, an automatic check, and approval from the owner of that area. This gives the business
a full history of who changed which rule, when, and why, with the ability to undo it.

### 7. Honest about its own limits

Every check Codsy runs carries an evidence label:

- **Strong**: checks a verifiable fact. Every finding is a real problem.
- **Weak**: checks a real signal by pattern matching, with known false positives and false
  negatives.
- **Heuristic**: a cheap stand-in for something that cannot be measured directly, such as
  line count as a stand-in for readability. A prompt to look closer, not a verdict.

Teams fix strong findings first and use judgment on the rest. When a finding is a false
alarm, it can be silenced in place, but only with a written reason, so the exception itself
is reviewable.

### 8. Safe by default

Knowledge files end up in the hands of agents, CI logs, and contractors. Codsy treats four
problems as errors from day one: secrets (API keys, tokens), text that looks like an attempt
to manipulate an AI agent, unapproved executable scripts in a skill folder, and personal
data such as emails, phone numbers, or national ID numbers. When it finds a secret or
personal data, it never repeats the full value in its output.

Every command except `codsy eval` works fully offline. `codsy eval` is the one deliberate
exception, and `codsy eval --dry-run` shows exactly what would be sent before anything is.

### 9. Usable without a terminal

Every step of the method can be done through a browser and a pull request. The terminal
tool adds guided wizards and faster feedback, but it is a convenience, not a requirement.
Every interactive flow also has a flag-only equivalent, so the same steps can be scripted.

## How the method works in practice

The method is a loop. Each turn of the loop makes the knowledge more explicit and more
trustworthy.

```
  capture  ->  structure  ->  check  ->  prove  ->  review  ->  maintain
     ^                                                              |
     +--------------------------------------------------------------+
```

### 1. Capture

Pick one decision the business makes often and that matters when it goes wrong. Sit with
the person who makes it and ask: what is the decision, when does it happen, what are the
rules, what are the exceptions, and can you show two real examples? `codsy new skill` asks
exactly these questions and writes the file as you answer.

### 2. Structure

Describe the data the decision reads as a schema, and rewrite the rules so they refer to
its fields. This is usually where hidden ambiguity surfaces: "large" becomes a number,
"urgent" becomes a list of allowed values, and disagreements between people who thought
they were following the same rule come to light.

### 3. Check

Run `codsy check`. It reports anything missing, vague, inconsistent, or unsafe, each finding
with the file, the line, the problem, and the fix in one plain sentence. Fix what it finds.
On GitHub, the same check runs automatically on every pull request and posts the result as
a single comment.

### 4. Prove

Write eval cases: at least ten per skill, covering the normal path and every exception.
Prefer real past decisions where possible. Run `codsy eval` to send the skill, its schemas,
its context, and each case to a model of your choice, and compare its answers with the
expected ones. A skill passes when its accuracy meets the threshold you set (80% by
default). Failed cases are shown side by side as expected versus actual.

A failing eval means one of three things, and each is useful to know:

- The rule is ambiguous, so the model filled the gap differently than you would.
- The rule is missing an exception that the case exercises.
- The expected answer is wrong, and the business does not actually decide that way.

### 5. Review

Open a pull request. The owner of the area reviews the change, the automatic check confirms
the files are well formed, and, when a model provider is configured, the evals confirm the
decisions still come out right. The change is merged only when all three agree.

### 6. Maintain

Each skill's review date comes due on its own schedule, and `codsy check` reports overdue
reviews. When a real decision turns out differently from what a skill says, that case
becomes a new eval and the skill is corrected. Periodically, run a full
[knowledge audit](knowledge-audit.md) to see how much of the project is trustworthy, not
just how much exists.

## Getting started with the method

Teams that adopt Codsy successfully tend to start small:

1. **Pick one decision.** Choose something frequent, rule-based, and costly to get wrong,
   such as lead routing, ticket triage, or invoice follow-up. The bundled sales, support,
   and finance templates show a complete example of each.
2. **Write it with its owner.** Use the wizard or the template, not a blank page.
3. **Make the check pass.** Treat every error as a question the business had not answered
   yet.
4. **Write ten cases from real history.** This is the step that turns a document into
   something you can trust.
5. **Turn on the pull request check.** From this point, the knowledge cannot silently
   degrade.
6. **Add the next decision.** Grow one skill at a time, reusing schemas and context.

## When Codsy is the wrong tool

- **One-off tasks.** The method pays off for decisions made repeatedly. A task done once
  does not need a versioned file and a review process.
- **Strictly deterministic processes.** If a decision is pure calculation, such as tax or a
  unit conversion, write code. Skills are for judgment calls that need documented rules.
- **Fast-changing facts.** Prices, stock levels, and other facts that change by the hour
  belong in a database that systems query live, not in a reviewed file.

## What Codsy is not

- **Not a way to make AI smarter.** It changes what an agent reads, not what it can do.
- **Not a guarantee of correctness.** A clean check means a file is well formed. Only evals
  against real cases, and human review, speak to whether a rule is right.
- **Not an agent runtime or automation platform.** Codsy produces and checks the knowledge;
  running agents on it is left to whatever tools a team already uses.
- **Not a wiki replacement for everything.** It is for decisions, their data, and their
  reasons, not for meeting notes, onboarding guides, or general documentation.
- **Not a vendor lock-in.** Files are plain Markdown, YAML, and JSON Schema in your own
  repository. Evals work with Anthropic, any OpenAI-compatible API, or a local command you
  control.

## Glossary

| Term                | Meaning                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Skill**           | One recurring business decision, written as a `SKILL.md` file with seven sections.      |
| **Schema**          | A JSON Schema file describing the data a skill reads.                                   |
| **Context**         | Background files explaining the company, its customers, and why the rules exist.        |
| **Eval**            | A set of test cases for a skill, each pairing an input with its expected decision.      |
| **Check**           | The offline review of form: completeness, specificity, consistency, safety.             |
| **Rule**            | One specific check Codsy runs, identified by a code such as `CODSY030`.                 |
| **Severity**        | How serious a finding is: `error` fails the check, `warn` is a suggestion, `off` skips. |
| **Evidence label**  | How reliable a rule is: strong, weak, or heuristic.                                     |
| **Owner**           | The team or person responsible for keeping a skill correct.                             |
| **Threshold**       | The minimum share of eval cases a skill must get right to pass, 80% by default.         |
| **Historical case** | An eval case taken from a real past decision.                                           |
| **Synthetic case**  | An eval case written to cover a situation, usually an edge case.                        |

## Further reading

- [Getting started](getting-started.md): install, create a project, run every command.
- [Writing a good skill](writing-a-good-skill.md): the craft of a clear, testable skill.
- [Running a knowledge audit](knowledge-audit.md): assessing an existing project.
- [Rules](rules/index.md): every check, with its rationale and evidence label.
- [Security](security.md): what Codsy sends where, and what it refuses to store.
- [GitHub Action](github-action.md): automatic checks on every pull request.
- [FAQ](faq.md)
