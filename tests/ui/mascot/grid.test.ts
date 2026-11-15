import { describe, expect, it } from 'vitest';
import {
  BASE_GRID,
  BASE_GRID_HEIGHT,
  BASE_GRID_WIDTH,
  hexToAnsiForeground,
  renderGridLines,
} from '../../../src/ui/mascot/grid';

describe('BASE_GRID', () => {
  it('matches its declared dimensions', () => {
    expect(BASE_GRID).toHaveLength(BASE_GRID_HEIGHT);
    expect(BASE_GRID.every((row) => row.length === BASE_GRID_WIDTH)).toBe(true);
  });

  it('contains only "#" and "." characters', () => {
    expect(BASE_GRID.every((row) => /^[#.]+$/.test(row))).toBe(true);
  });
});

describe('renderGridLines', () => {
  it('pairs two grid rows into one terminal line using half blocks', () => {
    const grid = ['#.', '.#'];
    expect(renderGridLines(grid, 'none')).toEqual(['▀▄']);
  });

  it('renders a fully filled pair as a full block', () => {
    expect(renderGridLines(['#', '#'], 'none')).toEqual(['█']);
  });

  it('renders a fully empty pair as a space', () => {
    expect(renderGridLines(['.', '.'], 'none')).toEqual([' ']);
  });

  it('pads an odd number of rows with a blank row', () => {
    const lines = renderGridLines(['#', '.', '#'], 'none');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('▀');
    expect(lines[1]).toBe('▀');
  });

  it('applies no color codes when colorLevel is none', () => {
    const [line] = renderGridLines(['#'], 'none');
    expect(line).toBe('▀');
  });

  it('wraps each line in an ANSI escape and reset when color is enabled', () => {
    const [line] = renderGridLines(['#'], 'truecolor');
    expect(line?.startsWith('\x1b[38;2;')).toBe(true);
    expect(line?.endsWith('\x1b[0m')).toBe(true);
  });
});

describe('hexToAnsiForeground', () => {
  it('returns null when color is disabled', () => {
    expect(hexToAnsiForeground('#D6C6B9', 'none')).toBeNull();
  });

  it('emits a 24-bit escape for truecolor', () => {
    expect(hexToAnsiForeground('#D6C6B9', 'truecolor')).toBe('\x1b[38;2;214;198;185m');
  });

  it('emits a 256-color escape for 256 and 16 levels', () => {
    // eslint-disable-next-line no-control-regex -- matching a real ANSI escape byte is the point
    const pattern = /^\x1b\[38;5;\d+m$/;
    expect(hexToAnsiForeground('#D6C6B9', '256')).toMatch(pattern);
    expect(hexToAnsiForeground('#D6C6B9', '16')).toMatch(pattern);
  });
});
