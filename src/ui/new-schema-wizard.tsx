import type { JSX } from 'react';
import { useState } from 'react';
import { Box, render, Text, useInput } from 'ink';
import { StepIndicator } from './components/StepIndicator';
import { TextInput } from './components/TextInput';
import { FramedPanel } from './components/FramedPanel';
import { KeyHintFooter } from './components/KeyHintFooter';
import {
  buildSchemaJson,
  type SchemaAnswers,
  type SchemaFieldAnswer,
  type SchemaFieldType,
} from '../cli/templates/schema-json';

type WizardStage =
  'name' | 'description' | 'field-name' | 'field-type' | 'field-description' | 'more-fields';

const VALID_TYPES: readonly SchemaFieldType[] = ['string', 'integer', 'number', 'boolean'];

function isSchemaFieldType(value: string): value is SchemaFieldType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

interface WizardProps {
  onDone: (answers: SchemaAnswers | null) => void;
}

export function Wizard({ onDone }: WizardProps): JSX.Element {
  const [stage, setStage] = useState<WizardStage>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<SchemaFieldAnswer[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<SchemaFieldType | null>(null);
  const [draft, setDraft] = useState('');

  useInput((_input, key) => {
    if (key.escape) onDone(null);
  });

  function finish(finalFields: SchemaFieldAnswer[]): void {
    if (finalFields.length === 0) {
      onDone(null);
      return;
    }
    const [first, ...rest] = finalFields as [SchemaFieldAnswer, ...SchemaFieldAnswer[]];
    onDone({ name, description, fields: [first, ...rest] });
  }

  function handleSubmit(value: string): void {
    const trimmed = value.trim();

    if (stage === 'name') {
      if (trimmed.length === 0) return;
      setName(trimmed);
      setDraft('');
      setStage('description');
    } else if (stage === 'description') {
      if (trimmed.length === 0) return;
      setDescription(trimmed);
      setDraft('');
      setStage('field-name');
    } else if (stage === 'field-name') {
      if (trimmed.length === 0) return;
      setFieldName(trimmed);
      setDraft('');
      setStage('field-type');
    } else if (stage === 'field-type') {
      if (!isSchemaFieldType(trimmed)) return;
      setFieldType(trimmed);
      setDraft('');
      setStage('field-description');
    } else if (stage === 'field-description') {
      if (trimmed.length === 0 || !fieldType) return;
      const nextFields = [...fields, { name: fieldName, type: fieldType, description: trimmed }];
      setFields(nextFields);
      setFieldName('');
      setFieldType(null);
      setDraft('');
      setStage('more-fields');
    } else if (stage === 'more-fields') {
      if (trimmed.toLowerCase().startsWith('n')) {
        finish(fields);
      } else {
        setDraft('');
        setStage('field-name');
      }
    }
  }

  const question = {
    name: 'What should this schema be called?',
    description: 'What is this schema for, in one sentence?',
    'field-name': 'Add a field. What is its name?',
    'field-type': 'What type is it? (string, integer, number, or boolean)',
    'field-description': 'What does this field mean?',
    'more-fields': 'Add another field? (y/n)',
  }[stage];

  const previewFields = fieldType
    ? [...fields, { name: fieldName, type: fieldType, description: '(description)' }]
    : fields;
  const preview =
    name.length > 0 && previewFields.length > 0
      ? buildSchemaJson({
          name,
          description: description || '(description)',
          fields: previewFields as [SchemaFieldAnswer, ...SchemaFieldAnswer[]],
        })
      : '';

  return (
    <Box flexDirection="column">
      <StepIndicator current={fields.length + 1} total={fields.length + 1} label="Schema fields" />
      <Text>{question}</Text>
      <TextInput value={draft} onChange={setDraft} onSubmit={handleSubmit} />
      <FramedPanel title="Preview">
        <Text>{preview || '(nothing yet)'}</Text>
      </FramedPanel>
      <KeyHintFooter hints="enter submit · esc cancel" />
    </Box>
  );
}

export async function promptForSchemaAnswers(): Promise<SchemaAnswers | null> {
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
