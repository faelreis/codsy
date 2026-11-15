import type { JSX } from 'react';
import { useState } from 'react';
import { Box, render, Text, useInput } from 'ink';
import { StepIndicator } from './components/StepIndicator';
import { TextInput } from './components/TextInput';
import { FramedPanel } from './components/FramedPanel';
import { KeyHintFooter } from './components/KeyHintFooter';
import { buildSkillMarkdown, type SkillAnswers } from '../cli/templates/skill-markdown';

interface Step {
  key: keyof StepAnswers;
  question: string;
}

interface StepAnswers {
  name: string;
  owner: string;
  purpose: string;
  whenToUse: string;
  input: string;
  decisionLogic: string;
  exceptions: string;
  output: string;
  example1: string;
  example2: string;
}

const STEPS: Step[] = [
  {
    key: 'name',
    question: 'What should this skill be called (folder name, lowercase-with-dashes)?',
  },
  { key: 'owner', question: 'Who owns this decision?' },
  { key: 'purpose', question: 'What decision is this?' },
  { key: 'whenToUse', question: 'When does it happen?' },
  { key: 'input', question: 'What information does this decision need?' },
  { key: 'decisionLogic', question: 'What are the rules?' },
  { key: 'exceptions', question: 'What are the exceptions?' },
  { key: 'output', question: 'What does this decision produce?' },
  { key: 'example1', question: 'Give a real example (1 of 2).' },
  { key: 'example2', question: 'Give a real example (2 of 2).' },
];

const EMPTY_ANSWERS: StepAnswers = {
  name: '',
  owner: '',
  purpose: '',
  whenToUse: '',
  input: '',
  decisionLogic: '',
  exceptions: '',
  output: '',
  example1: '',
  example2: '',
};

function previewMarkdown(answers: StepAnswers): string {
  if (!answers.name) return '';
  return buildSkillMarkdown({
    name: answers.name || 'skill-name',
    owner: answers.owner || '(owner)',
    purpose: answers.purpose || '(purpose)',
    whenToUse: answers.whenToUse || '(when to use)',
    input: answers.input || '(input)',
    decisionLogic: answers.decisionLogic || '(decision logic)',
    exceptions: answers.exceptions || '(exceptions)',
    output: answers.output || '(output)',
    examples: [answers.example1 || '(example 1)', answers.example2 || '(example 2)'],
  });
}

interface WizardProps {
  onDone: (answers: SkillAnswers | null) => void;
}

export function Wizard({ onDone }: WizardProps): JSX.Element {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<StepAnswers>(EMPTY_ANSWERS);
  const [draft, setDraft] = useState('');

  useInput((_input, key) => {
    if (key.escape) onDone(null);
  });

  const step = STEPS[stepIndex];
  if (!step) {
    return <Text>Done.</Text>;
  }

  function handleSubmit(value: string): void {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;

    const nextAnswers = { ...answers, [step!.key]: trimmed };
    setAnswers(nextAnswers);
    setDraft('');

    if (stepIndex + 1 >= STEPS.length) {
      onDone({
        name: nextAnswers.name,
        owner: nextAnswers.owner,
        purpose: nextAnswers.purpose,
        whenToUse: nextAnswers.whenToUse,
        input: nextAnswers.input,
        decisionLogic: nextAnswers.decisionLogic,
        exceptions: nextAnswers.exceptions,
        output: nextAnswers.output,
        examples: [nextAnswers.example1, nextAnswers.example2],
      });
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  return (
    <Box flexDirection="column">
      <StepIndicator current={stepIndex + 1} total={STEPS.length} />
      <Text>{step.question}</Text>
      <TextInput value={draft} onChange={setDraft} onSubmit={handleSubmit} />
      <FramedPanel title="Preview">
        <Text>{previewMarkdown(answers) || '(nothing yet)'}</Text>
      </FramedPanel>
      <KeyHintFooter hints="enter submit · esc cancel" />
    </Box>
  );
}

export async function promptForSkillAnswers(): Promise<SkillAnswers | null> {
  return new Promise((resolve) => {
    const instance = render(
      <Wizard
        onDone={(answers) => {
          instance.unmount();
          resolve(answers);
        }}
      />,
    );
  });
}
