import type { JSX } from 'react';
import { Text } from 'ink';
import { THEME } from '../theme';

export interface StepIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export function StepIndicator({ current, total, label }: StepIndicatorProps): JSX.Element {
  return (
    <Text color={THEME.dim}>
      Step {current} of {total}
      {label ? ` — ${label}` : ''}
    </Text>
  );
}
