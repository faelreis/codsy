import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { THEME } from '../theme';
import { getAnimationFrames } from '../mascot/animations';
import { BASE_GRID, renderGridLines } from '../mascot/grid';

const IDLE_FRAME_MS = 500;
const IDLE_FRAMES = getAnimationFrames(BASE_GRID, 'idle');

interface IdleMascotProps {
  motionEnabled: boolean;
}

export function IdleMascot({ motionEnabled }: IdleMascotProps): JSX.Element {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!motionEnabled) return;
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % IDLE_FRAMES.length);
    }, IDLE_FRAME_MS);
    return () => clearTimeout(timer);
  }, [index, motionEnabled]);

  const lines = renderGridLines(IDLE_FRAMES[index] ?? BASE_GRID, 'none');
  return (
    <Box flexDirection="column">
      {lines.map((line, lineIndex) => (
        <Text key={lineIndex} color={THEME.sand}>
          {line}
        </Text>
      ))}
    </Box>
  );
}
