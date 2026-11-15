import type { JSX, ReactNode } from 'react';
import { Box, Text } from 'ink';
import { THEME } from '../theme';

export interface FramedPanelProps {
  title?: string;
  width?: number;
  children: ReactNode;
}

export function FramedPanel({ title, width, children }: FramedPanelProps): JSX.Element {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={THEME.dim}
      paddingX={1}
      width={width}
    >
      {title && (
        <Text color={THEME.sand} bold>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}
