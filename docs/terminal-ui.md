# Terminal UI

Codsy's interactive screens — `codsy init`, `codsy new skill`, `codsy new schema`,
`codsy check`, and the home screen shown by `codsy` with no arguments — are built with
[Ink](https://github.com/vadimdemedes/ink). Every one of them also has a
non-interactive, scriptable path.

## Rich vs. plain output

Rich output (color, the home screen mascot, live layout) only renders when all of these are true:

- stdout is an interactive terminal (a TTY).
- `--plain` wasn't passed.
- `NO_COLOR` isn't set.
- `--format` isn't `json` or `sarif` (those are always plain, byte-stable text).

Anywhere else — piped output, CI, a non-interactive shell — Codsy falls back to
plain, stable text automatically. You never need to detect this yourself; every
command behaves correctly either way.

## Color

Color depth is detected from the terminal and falls back through four levels:
truecolor, 256-color, 16-color, and no color. On a 16-color terminal, Codsy still
renders in color by mapping to the nearest 256-color escape code, since most modern
16-color terminals accept those codes even though they only display 16 distinct
colors.

## Motion

The mascot appears only on the home screen. Its idle animation can be turned off with `CODSY_NO_MOTION=1` or `--no-motion`. A static frame replaces
it — no screen ever requires motion to be readable.

## Keys

| Key                | Action                                      |
| ------------------ | ------------------------------------------- |
| `↑`/`↓` or `j`/`k` | Move the selection                          |
| `Enter`            | Confirm                                     |
| `Esc`              | Cancel and go back, at any step of a wizard |
| `?`                | Toggle the key-hint footer                  |

## Resizing

The terminal width is read live. The home screen's mascot hides automatically under
60 columns and reappears if you widen the terminal again mid-session — nothing needs
to be restarted.

## Errors and interruption

Any unexpected error produces a plain-language screen: what happened, how to fix it,
and the exact command to retry — never a raw stack trace. Pressing `Esc` inside any
wizard cancels cleanly without writing any files, and the terminal's cursor and raw
mode are always restored on exit, including on an interrupt.
