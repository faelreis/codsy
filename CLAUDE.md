# CLAUDE.md

This file is the persistent memory for Codsy across work sessions. Read it before making
changes.

## What Codsy is

A CLI and starter repository that help a company write its operational knowledge as
versioned files that people and AI agents can both read: schemas (what the business is),
skills (what it knows), context (why), and evals (proof it works). It must be usable by a
CEO, a non-technical process owner, and a developer.

## Permanent rules

- Everything in English: code, docs, CLI output, commit messages.
- Comments are rare. Only explain a non-obvious "why". No comments that restate code, no
  section banners, no narration of changes, no emojis.
- Small pure functions, explicit types, no dead code, no leftover TODOs.
- No network and no LLM calls anywhere except the "eval" command.
- Every feature ships with tests. Conventional commits.
- CLI text must be understandable by a non-technical reader.
- Verify current versions and specs of dependencies before using them.

## Folders

```
src/core      project loader, config, rule engine
src/rules     individual rule implementations
src/cli       command entry points
src/ui        terminal UI layer (Ink), mascot rendering
templates/    project/skill templates: blank, sales, support, finance
action/       GitHub Action
docs/         documentation
tests/        mirrors the src/ structure
assets/brand/ logo and brand assets
```

## Brand and terminal experience

- Mascot: a pixel-art seriema. Product name: CODSY.
- Sand `#D6C6B9` for text, symbols, and the mascot. Charcoal `#1C1C1C` is the brand
  background: never repaint the user's terminal background; use it only as text color on
  sand-filled chips and in docs assets.
- Supporting tones, muted: dim `#8F857D`, success `#A3B58C`, warning `#D9B36C`, error
  `#D98C7A`.
- Voice: calm, short, plain words. No exclamation marks.
- Rich UI only when stdout is an interactive TTY. Plain, stable text when piped, in CI, with
  `--plain`, `--format json|sarif`, or `NO_COLOR`.
- Color fallback: truecolor, 256, 16, none.
- Motion off with `CODSY_NO_MOTION=1` or `--no-motion`; a static frame replaces each
  animation. Animations never change layout height.
- Always restore cursor and terminal state on exit and Ctrl+C.
- Every interactive flow has a flag-only equivalent.
- Lazy-load the UI layer so non-interactive commands stay fast.

### Mascot source of truth

21x19 grid, `#` = filled, facing right. Render two grid rows per terminal row with half
blocks (space, `▀`, `▄`, `█`):

```
..............#......
............#..#.....
.............#..#....
...........#..#.#....
............#.####...
.............###.##..
..............#######
..............###....
..............##.....
.....########.##.....
...#########..##.....
.###..#####..###.....
###.........###......
....##########.......
..###...#..#.........
.###....#..#.........
........#..#.........
........#..##........
.......###..###......
```

Animations are small diffs over this base grid: idle (blink, crest twitch), walk, peck
(head dips), alert (crest raised), celebrate (short hop), think (slow head tilt). There is
no mini sprite: it was removed along with the unused header component.

The mascot is shown only on the home screen (`codsy` with no arguments). It was removed
from `codsy check` and the `codsy mascot` command was dropped because the small renders
looked poor; do not add it to other commands.

## Engineering baseline (decided at kickoff, 2026-11-14)

- Node `>=22.12.0`. The brief originally said "Node 20+"; Node 20 reached end-of-life on
  2026-04-30, so the floor was raised to the first still-maintained LTS line. The `.12`
  patch is also vitest 5's own minimum.
- TypeScript `5.9.3`, exact pin. The brief said "TypeScript strict" with no version;
  TypeScript 7.0 ("latest") ships with no stable compiler API, which breaks both
  typescript-eslint and tsup, so the final 5.x release is used instead until the ecosystem
  catches up with TS 7.1+.
- npm, single package, `"type": "module"`.
- vitest for tests (tests live under `tests/`, mirroring `src/`, not colocated).
- ESLint 10 (flat config) + typescript-eslint for linting. ESLint 9 reached end of
  maintenance in 2026-08, so 10 is used instead of the brief's `^9`.
- Prettier, standalone, for formatting (not run through ESLint — `eslint-config-prettier`
  only disables conflicting stylistic rules).
- tsup (esbuild-based) for building.
- Single bin: `codsy` -> `./dist/cli.js`.
- License: Apache-2.0.
- GitHub Actions: `actions/checkout@v7`, `actions/setup-node@v7` (the brief said `v4`,
  which predates GitHub's removal of Node 20 runners).

Re-verify these versions before bumping any of them — this file records what was current
and compatible at kickoff time, not a permanent pin.
