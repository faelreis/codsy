# Rules

Every rule is a pure function `(project, config) => Diagnostic[]`. Each page below
states what the rule checks, why it matters, how to fix it, and an **evidence label**:

- **strong** — checks a verifiable fact. Every reported case is a real problem.
- **weak** — checks a real signal with known false positives or false negatives
  (pattern matching, not semantic understanding).
- **heuristic** — a cheap proxy for something that can't be measured directly (e.g.
  line count as a proxy for readability). Useful as a prompt to look closer, not a
  verdict on its own.

| Rule                    | Default severity             | Evidence  | Checks                                                               |
| ----------------------- | ---------------------------- | --------- | -------------------------------------------------------------------- |
| [CODSY001](CODSY001.md) | error                        | strong    | Skill frontmatter is invalid or its name doesn't match its folder    |
| [CODSY002](CODSY002.md) | warn                         | heuristic | Skill description is missing, too short, or silent on when to use it |
| [CODSY010](CODSY010.md) | error                        | strong    | Skill is missing a required section                                  |
| [CODSY011](CODSY011.md) | error                        | heuristic | Skill has fewer than the required worked examples                    |
| [CODSY012](CODSY012.md) | warn                         | strong    | Skill's Exceptions section is empty                                  |
| [CODSY050](CODSY050.md) | warn                         | strong    | Skill has no owner, or its review is overdue                         |
| [CODSY070](CODSY070.md) | warn (error with `--strict`) | strong    | Skill has no evals, or fewer than the required cases                 |
| [CODSY020](CODSY020.md) | warn                         | heuristic | Skill body is longer than the configured line limit                  |
| [CODSY021](CODSY021.md) | warn                         | weak      | Two skills have highly similar descriptions                          |
| [CODSY030](CODSY030.md) | warn                         | weak      | A sentence uses a vague term with no concrete reference              |
| [CODSY100](CODSY100.md) | error                        | strong    | Schema doesn't validate against the JSON Schema 2020-12 meta-schema  |
| [CODSY101](CODSY101.md) | warn                         | strong    | Schema property has no description                                   |
| [CODSY102](CODSY102.md) | warn                         | heuristic | Schema requires more fields than the configured limit                |
| [CODSY103](CODSY103.md) | warn                         | strong    | Schema enum has no description of its values                         |
| [CODSY104](CODSY104.md) | error                        | strong    | Skill references a schema that doesn't exist                         |
| [CODSY105](CODSY105.md) | error                        | strong    | Eval case input doesn't match its schema                             |
| [CODSY060](CODSY060.md) | error                        | weak      | File appears to contain a secret                                     |
| [CODSY061](CODSY061.md) | error                        | weak      | File contains text shaped like a prompt-injection attempt            |
| [CODSY062](CODSY062.md) | error                        | strong    | Skill folder contains a script not on the allowlist                  |
| [CODSY080](CODSY080.md) | error                        | weak      | File appears to contain real personal data                           |

Run `codsy explain <RULE_ID>` from the terminal for the same information without
leaving your project.
