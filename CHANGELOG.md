# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-15

Initial release.

### Added

- Project loader and SKILL.md parser, compatible with the open Agent Skills
  standard, with config loading/merging and an inline-ignore mechanism.
- A rule engine, and 23 built-in rules covering schema validity (CODSY1xx),
  skill structure and quality (CODSY0[0-2,5,7]x), and security and privacy
  (CODSY0[6,8]x).
- A terminal UI layer built on Ink: theme tokens, capability detection
  (TTY/color depth/width/motion), and a component kit (header, inputs, lists,
  cards, panels).
- The pixel-art seriema mascot, shown with an idle animation on the home screen
  only.
- `codsy init`, with blank/sales/support/finance starter templates.
- `codsy check`, `codsy new skill|schema`, `codsy explain`, and the no-argument
  home screen. `check` reports when no Codsy project is found, and `eval` and
  `new` refuse to run outside one.
- `codsy --help` (also `-h` and `codsy help`), listing every command and flag.
- `codsy eval`, with "command," "anthropic," and "openai-compatible" providers
  behind one interface.
- A composite GitHub Action that runs `codsy check` on pull requests, uploads a
  SARIF report, and posts a single, self-updating summary comment.
- Friendly error screens, live terminal-resize handling, and escape-to-cancel at
  every step of every wizard.
- A three-audience README with a quick start, and a full `docs/` set, including
  the Codsy methodology and one page per rule.
