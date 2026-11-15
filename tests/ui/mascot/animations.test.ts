import { describe, expect, it } from 'vitest';
import {
  ANIMATIONS,
  applyDiffs,
  getAnimationFrames,
  type AnimationName,
} from '../../../src/ui/mascot/animations';
import { BASE_GRID, renderGridLines } from '../../../src/ui/mascot/grid';

const ANIMATION_NAMES = Object.keys(ANIMATIONS) as AnimationName[];

describe('applyDiffs', () => {
  it('toggles the requested cells and leaves everything else untouched', () => {
    const grid = ['...', '...'];
    const result = applyDiffs(grid, [
      { row: 0, col: 1, filled: true },
      { row: 1, col: 2, filled: true },
    ]);
    expect(result).toEqual(['.#.', '..#']);
  });

  it('never changes the shape of the grid', () => {
    const result = applyDiffs(BASE_GRID, [{ row: 5, col: 5, filled: true }]);
    expect(result).toHaveLength(BASE_GRID.length);
    result.forEach((row, index) => expect(row.length).toBe(BASE_GRID[index]?.length));
  });

  it('ignores cells outside the grid instead of widening a row', () => {
    expect(applyDiffs(['...'], [{ row: 0, col: 14, filled: false }])).toEqual(['...']);
  });
});

describe.each(ANIMATION_NAMES)('animation: %s', (name) => {
  it('produces frames that all share the base grid size', () => {
    const frames = getAnimationFrames(BASE_GRID, name);
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(frame).toHaveLength(BASE_GRID.length);
      frame.forEach((row, index) => expect(row.length).toBe(BASE_GRID[index]?.length));
    }
  });

  it('matches its rendered snapshot', () => {
    const frames = getAnimationFrames(BASE_GRID, name);
    const rendered = frames.map((frame) => renderGridLines(frame, 'none').join('\n'));
    expect(rendered.join('\n---\n')).toMatchSnapshot();
  });
});
