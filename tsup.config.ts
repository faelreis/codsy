import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli/index.ts' },
  format: ['esm'],
  target: 'node22',
  dts: true,
  clean: true,
  sourcemap: true,
  shims: false,
  // The UI layer (Ink, React, mascot rendering) is only reached through dynamic
  // imports in interactive flows, so it must land in its own chunks; otherwise
  // every command would pay to load it upfront.
  splitting: true,
});
