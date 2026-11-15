export type AnimationName = 'idle' | 'walk' | 'peck' | 'alert' | 'celebrate' | 'think';

export interface GridDiff {
  row: number;
  col: number;
  filled: boolean;
}

export interface AnimationFrame {
  diffs: readonly GridDiff[];
}

export interface Animation {
  name: AnimationName;
  frames: readonly AnimationFrame[];
}

export function applyDiffs(grid: readonly string[], diffs: readonly GridDiff[]): string[] {
  const rows = grid.map((row) => row.split(''));
  for (const diff of diffs) {
    const row = rows[diff.row];
    if (!row || diff.col >= row.length) continue;
    row[diff.col] = diff.filled ? '#' : '.';
  }
  return rows.map((row) => row.join(''));
}

export const ANIMATIONS: Readonly<Record<AnimationName, Animation>> = {
  idle: {
    name: 'idle',
    frames: [
      { diffs: [] },
      { diffs: [{ row: 2, col: 13, filled: false }] },
      { diffs: [{ row: 0, col: 14, filled: false }] },
      { diffs: [] },
    ],
  },
  walk: {
    name: 'walk',
    frames: [
      { diffs: [] },
      {
        diffs: [
          { row: 14, col: 2, filled: false },
          { row: 14, col: 3, filled: false },
          { row: 14, col: 4, filled: false },
          { row: 14, col: 6, filled: true },
          { row: 14, col: 7, filled: true },
        ],
      },
    ],
  },
  peck: {
    name: 'peck',
    frames: [
      { diffs: [] },
      {
        diffs: [
          { row: 0, col: 14, filled: false },
          { row: 1, col: 12, filled: false },
          { row: 1, col: 15, filled: false },
        ],
      },
      { diffs: [] },
    ],
  },
  alert: {
    name: 'alert',
    frames: [{ diffs: [] }, { diffs: [{ row: 0, col: 13, filled: true }] }],
  },
  celebrate: {
    name: 'celebrate',
    frames: [
      { diffs: [] },
      {
        diffs: [
          { row: 18, col: 7, filled: false },
          { row: 18, col: 8, filled: false },
          { row: 18, col: 9, filled: false },
          { row: 18, col: 13, filled: false },
          { row: 18, col: 14, filled: false },
          { row: 18, col: 15, filled: false },
        ],
      },
      { diffs: [] },
    ],
  },
  think: {
    name: 'think',
    frames: [
      { diffs: [] },
      {
        diffs: [
          { row: 1, col: 15, filled: false },
          { row: 1, col: 17, filled: true },
        ],
      },
      {
        diffs: [
          { row: 1, col: 15, filled: false },
          { row: 2, col: 17, filled: true },
        ],
      },
      { diffs: [] },
    ],
  },
};

export function getFramesFor(grid: readonly string[], animation: Animation): string[][] {
  return animation.frames.map((frame) => applyDiffs(grid, frame.diffs));
}

export function getAnimationFrames(
  grid: readonly string[],
  animationName: AnimationName,
): string[][] {
  return getFramesFor(grid, ANIMATIONS[animationName]);
}
