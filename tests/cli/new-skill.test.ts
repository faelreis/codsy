import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  answersFromFlags,
  parseNewSkillFlags,
  runNewSkill,
  writeSkillFiles,
} from '../../src/cli/new-skill';
import type { SkillAnswers } from '../../src/cli/templates/skill-markdown';

const FULL_FLAGS = [
  '--name',
  'lead-qualification',
  '--owner',
  'sales-ops',
  '--purpose',
  'Decide whether a lead should be routed to sales.',
  '--when-to-use',
  'a new lead arrives.',
  '--input',
  'a lead record.',
  '--decision-logic',
  'route leads over 50 employees to sales.',
  '--exceptions',
  'none known.',
  '--output',
  'a routing decision.',
  '--example',
  'a 120-employee lead routes to sales.',
  '--example',
  'a 5-employee lead routes to nurture.',
];

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

async function makeProjectDir(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), 'codsy-new-skill-'));
  await writeFile(join(rootDir, 'codsy.config.yaml'), '');
  return rootDir;
}

describe('parseNewSkillFlags', () => {
  it('parses every flag, including repeated --example', () => {
    const flags = parseNewSkillFlags(FULL_FLAGS);
    expect(flags.name).toBe('lead-qualification');
    expect(flags.examples).toHaveLength(2);
  });

  it('leaves unset flags undefined rather than throwing', () => {
    expect(parseNewSkillFlags([]).name).toBeUndefined();
  });
});

describe('answersFromFlags', () => {
  it('builds full answers when every required flag is present', () => {
    const { answers, missing } = answersFromFlags(parseNewSkillFlags(FULL_FLAGS));
    expect(missing).toEqual([]);
    expect(answers?.name).toBe('lead-qualification');
    expect(answers?.examples).toHaveLength(2);
  });

  it('reports every missing field by name', () => {
    const { answers, missing } = answersFromFlags(parseNewSkillFlags([]));
    expect(answers).toBeNull();
    expect(missing).toContain('name');
    expect(missing).toContain('examples');
  });

  it('requires at least two examples', () => {
    const { missing } = answersFromFlags(
      parseNewSkillFlags([...FULL_FLAGS.slice(0, FULL_FLAGS.length - 2)]),
    );
    expect(missing).toContain('examples');
  });
});

describe('writeSkillFiles', () => {
  it('writes SKILL.md and an evals stub to the right paths', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'codsy-new-skill-'));
    const answers: SkillAnswers = {
      name: 'order-escalation',
      owner: 'ops',
      purpose: 'Decide whether an order should be escalated.',
      whenToUse: 'an order is flagged as delayed.',
      input: 'an order record.',
      decisionLogic: 'escalate orders delayed more than 3 days.',
      exceptions: 'none known.',
      output: 'a decision.',
      examples: ['a 5-day-delayed order escalates.', 'a 1-day-delayed order does not.'],
    };

    await writeSkillFiles(rootDir, answers);

    const skillMd = await readFile(join(rootDir, 'skills', 'order-escalation', 'SKILL.md'), 'utf8');
    expect(skillMd).toContain('name: order-escalation');
    expect(skillMd).toContain('## Decision logic');
    expect(skillMd).toContain('escalate orders delayed more than 3 days.');

    const evalsStub = await readFile(
      join(rootDir, 'evals', 'order-escalation', 'cases.yaml'),
      'utf8',
    );
    expect(evalsStub).toBe('skill: order-escalation\ncases: []\n');
  });
});

describe('runNewSkill', () => {
  it('refuses to run outside a Codsy project', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'codsy-new-skill-'));
    const { write, output } = makeWriter();

    const exitCode = await runNewSkill(FULL_FLAGS, { rootDir, write, isInteractive: false });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('No Codsy project found here.');
  });

  it('writes files and reports success when flags are complete', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();

    const exitCode = await runNewSkill(FULL_FLAGS, { rootDir, write, isInteractive: false });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Created skills/lead-qualification/SKILL.md');
  });

  it('fails with a plain-language error when flags are missing and not interactive', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();

    const exitCode = await runNewSkill([], { rootDir, write, isInteractive: false });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Missing:');
  });

  it('uses the interactive prompt when flags are missing and the terminal is interactive', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();
    const answers: SkillAnswers = {
      name: 'a',
      owner: 'b',
      purpose: 'c',
      whenToUse: 'd',
      input: 'e',
      decisionLogic: 'f',
      exceptions: 'g',
      output: 'h',
      examples: ['i', 'j'],
    };

    const exitCode = await runNewSkill([], {
      rootDir,
      write,
      isInteractive: true,
      promptForAnswers: () => Promise.resolve(answers),
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Created skills/a/SKILL.md');
  });

  it('cancels cleanly when the interactive prompt returns null', async () => {
    const rootDir = await makeProjectDir();
    const { write, output } = makeWriter();

    const exitCode = await runNewSkill([], {
      rootDir,
      write,
      isInteractive: true,
      promptForAnswers: () => Promise.resolve(null),
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Cancelled');
  });
});
