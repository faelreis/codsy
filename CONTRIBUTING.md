# Contributing to Codsy

Thanks for considering a contribution. This project follows the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Set up

You need Node.js 22.12 or newer and npm.

```bash
git clone https://github.com/faelreis/codsy.git
cd codsy
npm install
```

## Before you open a pull request

```bash
npm run build
npm run lint
npm run typecheck
npm run test
npm run format:check
```

All five must pass. CI runs the same checks, plus `actionlint` on every workflow
and composite action file.

## Project layout

```
src/core      project loader, config, diagnostic model, rule engine, eval providers
src/rules     individual rule implementations
src/cli       command entry points and their pure argument-parsing/orchestration logic
src/ui        terminal UI layer (Ink), mascot rendering — lazily imported, never
              loaded by a command that doesn't render it
templates/    the init templates: blank, sales, support, finance
action/       the composite GitHub Action
docs/         documentation
tests/        mirrors the src/ structure; tests/fixtures holds fixture projects
```

## Conventions

- Everything in English: code, docs, CLI output, commit messages.
- [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
  (`feat:`, `fix:`, `docs:`, and so on).
- Comments are rare — only a non-obvious "why," never a restatement of what the
  code already says.
- Small, pure functions with explicit types. A rule is always
  `(project, config) => Diagnostic[]`, with no side effects.
- No network calls anywhere except inside the `eval` command's providers.
- Every feature ships with tests, including a passing and a failing fixture for
  any new rule.

## Adding a new rule

1. Pick the next free rule id in its family (CODSY0xx for skill rules, CODSY1xx
   for schema rules, CODSY0[6-8]x for security rules — see
   [docs/rules/index.md](docs/rules/index.md) for what's taken).
2. Add the rule function to the relevant file in `src/rules/`, following the
   existing `Rule` signature.
3. Add it to that file's exported rule array, and to `src/core/all-rules.ts` if it
   belongs to a new file.
4. Add its documentation to `src/core/rule-docs.ts` (used by `codsy explain`) and
   a page under `docs/rules/` with an evidence label (see
   [docs/rules/index.md](docs/rules/index.md) for what "strong," "weak," and
   "heuristic" mean).
5. Add a passing and a failing fixture, and unit tests for both. If the rule fits
   naturally into one of the existing integration fixtures under `tests/fixtures`,
   extend that one instead of creating a new project fixture.

## Running the CLI locally without installing it

```bash
npm run build
node dist/cli.js check
```

## Publishing the starter template repository

See [docs/publishing-the-starter-template.md](docs/publishing-the-starter-template.md).

## Releasing

1. Update `version` in `package.json` and add the entry to `CHANGELOG.md`.
2. Commit, then push a tag that matches the version exactly, for example
   `git tag v1.2.0 && git push origin v1.2.0`.
3. The release workflow publishes the package to npm and then moves the major tag
   (`v1`) to the same commit, so workflows using `faelreis/codsy/action@v1` pick up the
   release. Pre-release tags such as `v1.3.0-rc.1` are published but never move `v1`.

Never create or move a major tag by hand. Never push a tag that does not match
`package.json`.
