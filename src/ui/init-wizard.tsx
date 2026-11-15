import type { JSX } from 'react';
import { Box, render, Text } from 'ink';
import { StepIndicator } from './components/StepIndicator';
import { SelectList } from './components/SelectList';
import { KeyHintFooter } from './components/KeyHintFooter';
import type { TemplateName } from '../cli/templates/copy-template';

const TEMPLATE_ITEMS: ReadonlyArray<{ label: string; value: TemplateName }> = [
  { label: 'Blank — start with no example skill', value: 'blank' },
  { label: 'Sales — lead qualification example', value: 'sales' },
  { label: 'Support — ticket triage example', value: 'support' },
  { label: 'Finance — collections classification example', value: 'finance' },
];

interface WizardProps {
  onDone: (template: TemplateName | null) => void;
}

function Wizard({ onDone }: WizardProps): JSX.Element {
  return (
    <Box flexDirection="column">
      <StepIndicator current={1} total={1} label="Choose a starting point" />
      <Text>What kind of project is this?</Text>
      <SelectList
        items={TEMPLATE_ITEMS}
        onSelect={(value) => onDone(value as TemplateName)}
        onCancel={() => onDone(null)}
      />
      <KeyHintFooter />
    </Box>
  );
}

export async function promptForTemplate(): Promise<TemplateName | null> {
  return new Promise((resolve) => {
    const instance = render(
      <Wizard
        onDone={(template) => {
          instance.unmount();
          resolve(template);
        }}
      />,
    );
  });
}
