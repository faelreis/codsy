# CODSY062 — Disallowed script in a skill folder

**Default severity**: error · **Evidence**: strong

## What it checks

That every executable file (by extension — `.sh`, `.py`, `.js`, `.ps1`, and
similar) inside a skill's folder is listed in `allowedScripts` in
`codsy.config.yaml`.

## Why it matters

An unreviewed script inside a skill folder can run arbitrary code wherever that
skill is used or packaged. Requiring an explicit allowlist means a script can only
ship after someone deliberately reviewed and approved it.

## How to fix

Review the script, then add it to `allowedScripts` as `<skill-dir>/<path>`, or
remove the script if it isn't actually needed.
