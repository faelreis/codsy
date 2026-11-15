import type { JSX } from 'react';
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { THEME } from '../theme';
import { DEFAULT_KEY_HINTS, KeyHintFooter } from './KeyHintFooter';

export interface SelectListItem {
  label: string;
  value: string;
}

export interface SelectListProps {
  items: readonly SelectListItem[];
  onSelect: (value: string) => void;
  onCancel?: () => void;
  initialIndex?: number;
}

export function SelectList({
  items,
  onSelect,
  onCancel,
  initialIndex = 0,
}: SelectListProps): JSX.Element {
  const [index, setIndex] = useState(initialIndex);
  const [helpVisible, setHelpVisible] = useState(false);

  useInput((input, key) => {
    if (items.length === 0) return;

    if (key.upArrow || input === 'k') {
      setIndex((current) => (current - 1 + items.length) % items.length);
    } else if (key.downArrow || input === 'j') {
      setIndex((current) => (current + 1) % items.length);
    } else if (key.return) {
      const item = items[index];
      if (item) onSelect(item.value);
    } else if (key.escape) {
      onCancel?.();
    } else if (input === '?') {
      setHelpVisible((visible) => !visible);
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, itemIndex) => (
        <Text key={item.value} {...(itemIndex === index ? { color: THEME.sand } : {})}>
          {itemIndex === index ? '> ' : '  '}
          {item.label}
        </Text>
      ))}
      {helpVisible && <KeyHintFooter hints={DEFAULT_KEY_HINTS} />}
    </Box>
  );
}
