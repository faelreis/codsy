# Security

## No network access, except `codsy eval`

Every command except `codsy eval` runs entirely offline — `codsy check`,
`codsy init`, `codsy new`, and `codsy explain` never make a network request.
`codsy eval` is the one deliberate exception: it sends your skill text, schemas,
context files, and eval case inputs to whichever model provider you configure, so
that it can check the skill's decisions. See
[writing-a-good-skill.md](writing-a-good-skill.md#prove-it-with-evals-not-just-lint)
for how providers are configured, and run `codsy eval --dry-run` to see exactly
what would be sent without sending anything.

## What the security rules catch

Four rules are error-severity by default — they fail `codsy check` immediately,
not just under `--strict`:

- [CODSY060](rules/CODSY060.md) — secrets (API keys, tokens, private key blocks).
- [CODSY061](rules/CODSY061.md) — text shaped like a prompt-injection attempt,
  aimed at an AI agent reading the file.
- [CODSY062](rules/CODSY062.md) — an executable script in a skill folder that
  isn't on an explicit allowlist.
- [CODSY080](rules/CODSY080.md) — personal data (emails, phone numbers, national
  ID formats).

See each rule's page for exactly what it does and doesn't catch — CODSY060, 061,
and 080 are pattern-based and have known false positives and false negatives; they
are a safety net, not a guarantee.

## Masked output

When CODSY060 or CODSY080 find a match, the diagnostic message never contains the
matched text itself — only a masked preview (the first two and last two
characters, with the middle replaced by asterisks). The intent is that a hit
should be treated as sensitive and investigated directly in the file, not copied
out of a CI log.

## The GitHub Action

[The bundled GitHub Action](github-action.md) needs `contents: read` to check out
and read your repository, `pull-requests: write` to post or update its one summary
comment, and `security-events: write` to upload the SARIF report. It never needs
write access to your repository's actual files or history. If you don't want the
comment or the SARIF upload, set `comment: false` and drop
`security-events: write` from your workflow's permissions.

## Reporting a vulnerability

See [SECURITY.md](../SECURITY.md) in the repository root for how to report a
security issue in Codsy itself.
