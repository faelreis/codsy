# Brand

## Name and mascot

The product is **Codsy**. The mascot is a pixel-art seriema, a long-legged bird
known for walking into trouble and sorting it out — a good fit for a tool that
walks through your files looking for problems.

## Colors

| Token    | Hex       | Use                                                                                                               |
| -------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| sand     | `#D6C6B9` | Text, symbols, and the mascot                                                                                     |
| charcoal | `#1C1C1C` | Background only, as text color on sand-filled chips, and in docs assets — never used to repaint a user's terminal |
| dim      | `#8F857D` | Secondary text, key hints                                                                                         |
| success  | `#A3B58C` | A clean result                                                                                                    |
| warning  | `#D9B36C` | A warning-level finding                                                                                           |
| error    | `#D98C7A` | An error-level finding                                                                                            |

Charcoal is the one color that never touches a user's actual terminal background.
It exists for text-on-sand chips and for docs/marketing assets like the README hero,
where it guarantees the sand-colored logo stays visible regardless of whether the
viewer is using a light or dark GitHub theme.

## Voice

Calm, short, plain words. No exclamation marks, no jargon on a first screen, no
emojis anywhere — in the CLI, in commit messages, or in these docs.

## Logo assets

`assets/brand/logo-codsy-horizontal.svg` and `assets/brand/logo-codsy-symbol.svg`
are the two base logo marks, both rendered in sand with no background fill — they're
meant to be placed on whatever background the surface already has.
`assets/brand/codsy-hero.png` is the wide banner with a charcoal background baked in,
used specifically for the README hero.

## Mascot source of truth

A 21×19 grid, `#` = filled, facing right. Rendered two grid rows per terminal row
using half-block characters (space, `▀`, `▄`, `█`):

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

Six animations exist as small diffs over this base grid: idle (blink, crest twitch),
walk, peck (head dips), alert (crest raised, on
errors), celebrate (short hop, on a clean result), and think (slow head tilt, during
`codsy eval`). See
[src/ui/mascot/grid.ts](../src/ui/mascot/grid.ts) and
[src/ui/mascot/animations.ts](../src/ui/mascot/animations.ts) for the implementation.
