import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  buildSchemaJson,
  type SchemaAnswers,
  type SchemaFieldAnswer,
  type SchemaFieldType,
} from './templates/schema-json';

const NO_PROJECT_MESSAGE = 'No Codsy project found here. Run codsy init to start one.\n';

const VALID_TYPES: readonly SchemaFieldType[] = ['string', 'integer', 'number', 'boolean'];

function isSchemaFieldType(value: string): value is SchemaFieldType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

function readFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  return argv[index + 1];
}

function readFields(argv: string[]): SchemaFieldAnswer[] {
  const fields: SchemaFieldAnswer[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] !== '--field') continue;
    const raw = argv[i + 1];
    if (raw === undefined) continue;
    const [name, type, ...descriptionParts] = raw.split(':');
    if (!name || !type || !isSchemaFieldType(type) || descriptionParts.length === 0) continue;
    fields.push({ name, type, description: descriptionParts.join(':') });
  }
  return fields;
}

export interface NewSchemaFlags {
  name: string | undefined;
  description: string | undefined;
  fields: SchemaFieldAnswer[];
}

export function parseNewSchemaFlags(argv: string[]): NewSchemaFlags {
  return {
    name: readFlag(argv, '--name'),
    description: readFlag(argv, '--description'),
    fields: readFields(argv),
  };
}

const REQUIRED_FLAG_HINT =
  '--name, --description, and at least one --field "name:type:description" (type is one of string, integer, number, boolean)';

export function answersFromFlags(flags: NewSchemaFlags): {
  answers: SchemaAnswers | null;
  missing: string[];
} {
  const missing: string[] = [];
  if (!flags.name) missing.push('name');
  if (!flags.description) missing.push('description');
  if (flags.fields.length === 0) missing.push('fields');

  if (missing.length > 0) return { answers: null, missing };

  const [first, ...rest] = flags.fields as [SchemaFieldAnswer, ...SchemaFieldAnswer[]];
  return {
    answers: { name: flags.name!, description: flags.description!, fields: [first, ...rest] },
    missing: [],
  };
}

export async function writeSchemaFile(rootDir: string, answers: SchemaAnswers): Promise<void> {
  const schemasDir = join(rootDir, 'schemas');
  await mkdir(schemasDir, { recursive: true });
  await writeFile(join(schemasDir, `${answers.name}.schema.json`), buildSchemaJson(answers));
}

export interface RunNewSchemaOptions {
  rootDir: string;
  write: (text: string) => void;
  isInteractive: boolean;
  promptForAnswers?: (() => Promise<SchemaAnswers | null>) | undefined;
}

export async function runNewSchema(argv: string[], options: RunNewSchemaOptions): Promise<number> {
  if (!existsSync(join(options.rootDir, 'codsy.config.yaml'))) {
    options.write(NO_PROJECT_MESSAGE);
    return 1;
  }

  const flags = parseNewSchemaFlags(argv);
  const { answers, missing } = answersFromFlags(flags);

  let finalAnswers = answers;
  if (finalAnswers === null) {
    if (!options.isInteractive || !options.promptForAnswers) {
      options.write(`Missing: ${missing.join(', ')}. Pass ${REQUIRED_FLAG_HINT}.\n`);
      return 1;
    }
    finalAnswers = await options.promptForAnswers();
    if (finalAnswers === null) {
      options.write('Cancelled. No files were created.\n');
      return 1;
    }
  }

  await writeSchemaFile(options.rootDir, finalAnswers);
  options.write(`Created schemas/${finalAnswers.name}.schema.json.\n`);
  return 0;
}
