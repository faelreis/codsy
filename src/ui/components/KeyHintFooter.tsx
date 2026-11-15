import type { JSX } from 'react';
import { Text } from 'ink';
import { THEME } from '../theme';

export const DEFAULT_KEY_HINTS = '↑↓/jk move · enter select · esc back · ? help';

export interface KeyHintFooterProps {
  hints?: string;
}

export function KeyHintFooter({ hints = DEFAULT_KEY_HINTS }: KeyHintFooterProps): JSX.Element {
  return <Text color={THEME.dim}>{hints}</Text>;
}
