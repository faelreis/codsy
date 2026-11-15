import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  answersFromFlags,
  parseNewSchemaFlags,
  runNewSchema,
  writeSchemaFile,
} from '../../src/cli/new-schema';
import type { SchemaAnswers } from '../../src/cli/templates/schema-json';

const FULL_FLAGS = [
  '--name',
  'order',
  '--description',
  'An order record.',
  '--field',
  'total_usd:number:The order total in US dollars.',
  '--field',
  'rush:boolean:Whether the order needs rush shipping.',
];

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

async function makeProjectDir(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), 'codsy-new-schema-'));
  await writeFile(join(rootDir, 'codsy.config.yaml'), '');
  return rootDir;
}

describe('parseNewSchemaFlags', () => {
  it('parses name, description, and every --field', () => {
    const flags = parseNewSchemaFlags(FULL_FLAGS);
    expect(flags.name).toBe('order');
    expect(flags.fields).toHaveLength(2);
    expect(flags.fields[0]).toEqual({
      name: 'total_usd',
      type: 'number',
      description: 'The order total in US dollars.',
    });
  });

  it('ignores a field with an invalid type instead of crashing', () => {
    const flags = parseNewSchemaFlags(['--field', 'x:not-a-type:something']);
    expect(flags.fields).toEqual([]);
  });

  it('keeps colons inside the description intact', () => {
    const flags = parseNewSchemaFlags(['--field', 'x:string:a value like 10:30am']);
    expect(flags.fields[0]?.description).toBe('a value like 10:30am');
  });
});

describe('answersFromFlags', () => {
  it('builds answers when name, description, and at least one field are present', () => {
    const { answers, missing } = answersFromFlags(parseNewSchemaFlags(FULL_FLAGS));
    expect(missing).toEqual([]);
    expect(answers?.fields).toHaveLength(2);
  });

  it('reports every missing field by name', () => {
    const { answers, missing } = answersFromFlags(parseNewSchemaFlags([]));
    expect(answers).toBeNull();
    expect(missing).toEqual(['name', 'description', 'fields']);
  });
});

describe('writeSchemaFile', () => {
  it('writes a schema with a description for every field', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'codsy-new-schema-'));
    const answers: SchemaAnswers = {
      name: 'order',
      description: 'An order record.',
      fields: [{ name: 'total_usd', type: 'number', description: 'The order total.' }],
    };

    await writeSchemaFile(rootDir, answers);

    const raw = await readFile(join(rootDir, 'schemas', 'order.schema.json'), 'utf8');
    const parsed = JSON.parse(raw) as { properties: Record<string, { description: string }> };
    expect(parsed.properties.total_usd?.description).toBe('The order total.');
  });
});

describe('runNewSchema', () => {
  it('refuses to run outside a Codsy project', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'codsy-new-schema-'));
    const { write, output } = makeWriter();

    const exitCode = await runNewSchema(FULL_FLAGS, { rootDir, write, isInteractive: false });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('No Codsy project found here.');
  });

  it('writes the schema and reports success when flags are complete', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();

    const exitCode = await runNewSchema(FULL_FLAGS, { rootDir, write, isInteractive: false });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Created schemas/order.schema.json');
  });

  it('fails with a plain-language error when flags are missing and not interactive', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();

    const exitCode = await runNewSchema([], { rootDir, write, isInteractive: false });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Missing:');
  });

  it('uses the interactive prompt when flags are missing and the terminal is interactive', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();
    const answers: SchemaAnswers = {
      name: 'a',
      description: 'b',
      fields: [{ name: 'c', type: 'string', description: 'd' }],
    };

    const exitCode = await runNewSchema([], {
      rootDir,
      write,
      isInteractive: true,
      promptForAnswers: () => Promise.resolve(answers),
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Created schemas/a.schema.json');
  });
});
