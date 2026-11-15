import type { ColorLevel } from '../capabilities';
import { THEME } from '../theme';

export const BASE_GRID: readonly string[] = [
  '..............#......',
  '............#..#.....',
  '.............#..#....',
  '...........#..#.#....',
  '............#.####...',
  '.............###.##..',
  '..............#######',
  '..............###....',
  '..............##.....',
  '.....########.##.....',
  '...#########..##.....',
  '.###..#####..###.....',
  '###.........###......',
  '....##########.......',
  '..###...#..#.........',
  '.###....#..#.........',
  '........#..#.........',
  '........#..##........',
  '.......###..###......',
];

export const BASE_GRID_WIDTH = 21;
export const BASE_GRID_HEIGHT = 19;

export function hexToAnsiForeground(hex: string, colorLevel: ColorLevel): string | null {
  if (colorLevel === 'none') return null;
  if (colorLevel === 'truecolor') {
    const [r, g, b] = hexToRgb(hex);
    return `[38;2;${r};${g};${b}m`;
  }
  return `[38;5;${hexToAnsi256(hex)}m`;
}

const ANSI_RESET = '[0m';

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function hexToAnsi256(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const toIndex = (channel: number): number => Math.round((channel / 255) * 5);
  return 16 + 36 * toIndex(r) + 6 * toIndex(g) + toIndex(b);
}

export function renderGridLines(grid: readonly string[], colorLevel: ColorLevel): string[] {
  const rows = grid.length % 2 === 0 ? grid : [...grid, '.'.repeat(grid[0]?.length ?? 0)];
  const lines: string[] = [];

  for (let i = 0; i < rows.length; i += 2) {
    const top = rows[i] ?? '';
    const bottom = rows[i + 1] ?? '';
    const width = Math.max(top.length, bottom.length);
    let line = '';
    for (let col = 0; col < width; col += 1) {
      const topFilled = top[col] === '#';
      const bottomFilled = bottom[col] === '#';
      line += pickHalfBlock(topFilled, bottomFilled);
    }
    lines.push(colorize(line, colorLevel));
  }

  return lines;
}

function pickHalfBlock(topFilled: boolean, bottomFilled: boolean): string {
  if (topFilled && bottomFilled) return '█';
  if (topFilled) return '▀';
  if (bottomFilled) return '▄';
  return ' ';
}

function colorize(line: string, colorLevel: ColorLevel): string {
  const code = hexToAnsiForeground(THEME.sand, colorLevel);
  if (!code) return line;
  return `${code}${line}${ANSI_RESET}`;
}
