import type { JSX } from 'react';
import { Text, useInput } from 'ink';
import { THEME } from '../theme';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ value, onChange, onSubmit, placeholder }: TextInputProps): JSX.Element {
  useInput((input, key) => {
    if (key.return) {
      onSubmit?.(value);
    } else if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input) {
      onChange(value + input);
    }
  });

  if (value.length === 0 && placeholder) {
    return <Text color={THEME.dim}>{placeholder}▌</Text>;
  }
  return <Text>{value}▌</Text>;
}
