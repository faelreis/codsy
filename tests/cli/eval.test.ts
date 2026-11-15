import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  formatDryRunPrompts,
  formatEvalReport,
  parseEvalArgs,
  runEvalCommand,
} from '../../src/cli/eval';
import type { SkillEvalResult } from '../../src/core/eval/run-eval';
import type { Project, Skill } from '../../src/core/project-loader';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('parseEvalArgs', () => {
  it('defaults to no skill, no threshold override, and not dry-run', () => {
    expect(parseEvalArgs([])).toEqual({
      skillName: null,
      threshold: null,
      dryRun: false,
      invalidThreshold: null,
    });
  });

  it('parses a positional skill name', () => {
    expect(parseEvalArgs(['lead-qualification']).skillName).toBe('lead-qualification');
  });

  it('parses --threshold as a number', () => {
    expect(parseEvalArgs(['--threshold', '0.9']).threshold).toBe(0.9);
  });

  it('parses --dry-run', () => {
    expect(parseEvalArgs(['--dry-run']).dryRun).toBe(true);
  });

  it('reports an invalid threshold instead of silently ignoring it', () => {
    expect(parseEvalArgs(['--threshold', 'not-a-number']).invalidThreshold).toBe('not-a-number');
  });

  it('parses a skill name together with other flags, in any order', () => {
    const args = parseEvalArgs(['lead-qualification', '--dry-run', '--threshold', '0.9']);
    expect(args).toEqual({
      skillName: 'lead-qualification',
      threshold: 0.9,
      dryRun: true,
      invalidThreshold: null,
    });
  });
});

function makeResult(overrides: Partial<SkillEvalResult> = {}): SkillEvalResult {
  return {
    skillName: 'lead-qualification',
    accuracy: 1,
    caseResults: [],
    ...overrides,
  };
}

describe('formatEvalReport', () => {
  it('reports when no skills had eval cases', () => {
    expect(formatEvalReport([], 0.8)).toBe('No skills with eval cases were found.\n');
  });

  it('shows an accuracy bar and passes when every skill meets the threshold', () => {
    const text = formatEvalReport([makeResult({ accuracy: 1 })], 0.8);
    expect(text).toContain('lead-qualification:');
    expect(text).toContain('100%');
    expect(text).toContain('Every skill meets the 80% threshold.');
  });

  it('lists failed cases with expected vs actual', () => {
    const text = formatEvalReport(
      [
        makeResult({
          accuracy: 0.5,
          caseResults: [
            {
              id: 'case-1',
              prompt: 'p',
              passed: false,
              expected: { decision: 'sales' },
              actual: { decision: 'nurture' },
              rawResponse: '{"decision":"nurture"}',
              error: null,
            },
          ],
        }),
      ],
      0.8,
    );
    expect(text).toContain('FAIL case-1');
    expect(text).toContain('expected: {"decision":"sales"}');
    expect(text).toContain('actual:   {"decision":"nurture"}');
    expect(text).toContain('1 skill(s) scored below the 80% threshold.');
  });
});

function makeSkill(dirName: string): Skill {
  return {
    dirName,
    filePath: `/fake/skills/${dirName}/SKILL.md`,
    relativePath: `skills/${dirName}/SKILL.md`,
    raw: `---\nname: ${dirName}\n---\n\n## Decision logic\n\nDo the thing.`,
    files: [],
    frontmatter: { name: dirName },
    frontmatterError: null,
    bodyStartLine: 4,
    sections: [],
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    rootDir: '/fake',
    schemas: [],
    skills: [],
    contextFiles: [],
    evalSuites: [],
    ...overrides,
  };
}

describe('formatDryRunPrompts', () => {
  it('builds one prompt per case without calling any provider', () => {
    const skill = makeSkill('lead-qualification');
    const project = makeProject({
      skills: [skill],
      evalSuites: [
        {
          skill: 'lead-qualification',
          filePath: '/fake/evals/lead-qualification/cases.yaml',
          relativePath: 'evals/lead-qualification/cases.yaml',
          raw: '',
          parseError: null,
          cases: [{ id: 'case-1', source: 'synthetic', input: { company_size: 10 }, expected: {} }],
        },
      ],
    });

    const text = formatDryRunPrompts([skill], project);
    expect(text).toContain('--- lead-qualification / case-1 ---');
    expect(text).toContain('"company_size": 10');
  });
});

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

describe('runEvalCommand', () => {
  it('refuses to run outside a Codsy project', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'codsy-eval-no-project-'));
    const { write, output } = makeWriter();

    const exitCode = await runEvalCommand(['--dry-run'], { rootDir, write });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('No Codsy project found here.');
  });

  it('prints prompts only and exits 0 for --dry-run, without needing a working provider', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runEvalCommand(['--dry-run'], {
      rootDir: join(FIXTURES_DIR, 'project-eval'),
      write,
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('--- lead-qualification /');
  });

  it('exits 0 when every case passes against the configured threshold', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runEvalCommand([], {
      rootDir: join(FIXTURES_DIR, 'project-eval'),
      write,
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('100%');
  });

  it('exits 1 when accuracy falls below the threshold', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runEvalCommand([], {
      rootDir: join(FIXTURES_DIR, 'project-eval-failing'),
      write,
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('scored below');
  });

  it('a --threshold flag overrides the config threshold', async () => {
    const { write } = makeWriter();
    const exitCode = await runEvalCommand(['--threshold', '1.1'], {
      rootDir: join(FIXTURES_DIR, 'project-eval'),
      write,
    });

    expect(exitCode).toBe(1);
  });

  it('fails with a plain-language error for an unknown skill name', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runEvalCommand(['not-a-real-skill'], {
      rootDir: join(FIXTURES_DIR, 'project-eval'),
      write,
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('No skill named "not-a-real-skill"');
  });
});
