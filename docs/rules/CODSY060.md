# CODSY060 — Secrets

**Default severity**: error · **Evidence**: weak

## What it checks

Every file against a set of patterns shaped like real secrets: AWS access keys,
GitHub and Slack tokens, private key blocks, and a generic
`key/secret/password/token = <long value>` pattern.

## Why it matters

Secrets committed to version control stay there even after they're removed from
the current file, and can be found by anyone with repository access, including
through the git history.

## Why this is weak evidence

Pattern matching catches known secret shapes, not secrets in general. A real
credential in an unrecognized format can evade every pattern here, and a
high-entropy string that merely looks like a secret (a hash, a generated ID) can
trigger a false positive. Codsy never prints the matched text itself — only a
masked preview — specifically because a match here should be treated as sensitive
until a human confirms otherwise.

## How to fix

Remove the secret from version control and rotate it immediately — assume it's
compromised the moment it was committed, even if you remove it in the same pull
request.
