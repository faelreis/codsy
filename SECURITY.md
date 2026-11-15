# Security policy

## Reporting a vulnerability

If you find a security issue in Codsy itself — the CLI, the rule engine, the
GitHub Action, or anything under `src/` or `action/` — please report it privately
rather than opening a public issue.

Open a
[private security advisory](https://github.com/faelreis/codsy/security/advisories/new)
on this repository. Include:

- A description of the issue and its impact.
- Steps to reproduce it, including the Codsy version and operating system.
- Anything else that would help us understand and fix it quickly.

We'll acknowledge your report, investigate, and let you know the outcome.

## What's in scope

- Codsy's own source code and the composite GitHub Action.
- Any way a crafted `codsy.config.yaml`, `SKILL.md`, schema, or eval file could
  make the CLI do something other than lint or evaluate the files it was given —
  for example, arbitrary code execution, path traversal outside the project
  directory, or secret exfiltration.
- Issues with the CODSY060/061/080 masking behavior that could leak a matched
  secret or personal data value.

## What's out of scope

- Findings in a project's own operational knowledge files, found by Codsy's rules
  as intended (CODSY060, CODSY061, CODSY080, and so on) — that's the tool working,
  not a vulnerability in it.
- Vulnerabilities in a configured eval provider (Anthropic, OpenAI, or a custom
  command) itself; report those to the provider directly.
