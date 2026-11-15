import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, loadConfig, mergeConfig } from '../../src/core/config';
import { loadProject } from '../../src/core/project-loader';
import type { Project, Skill } from '../../src/core/project-loader';
import { parseSkillMarkdown } from '../../src/core/skill-parser';
import { runRules } from '../../src/core/rule-engine';
import {
  codsy020OversizedBody,
  codsy021SimilarDescriptions,
  codsy030VagueStatement,
  skillQualityRules,
} from '../../src/rules/skill-quality-rules';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

function makeSkillFromMarkdown(dirName: string, raw: string): Skill {
  const parsed = parseSkillMarkdown(raw);
  return {
    ...parsed,
    dirName,
    filePath: `/fake/skills/${dirName}/SKILL.md`,
    relativePath: `skills/${dirName}/SKILL.md`,
    raw,
    files: [],
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

describe('CODSY020 oversized body', () => {
  it('passes a short body', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Purpose\n\nShort.\n');
    expect(codsy020OversizedBody(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails a body over the configured line limit', () => {
    const body = Array.from({ length: 20 }, (_, i) => `Line ${i}.`).join('\n');
    const skill = makeSkillFromMarkdown('a', `---\nname: a\n---\n\n${body}\n`);
    const config = mergeConfig({ maxSkillBodyLines: 10 });
    const diagnostics = codsy020OversizedBody(makeProject({ skills: [skill] }), config);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
    expect(diagnostics[0]?.fixHint).toContain('references/');
  });
});

describe('CODSY021 similar descriptions', () => {
  it('passes two skills with unrelated descriptions', () => {
    const project = makeProject({
      skills: [
        makeSkillFromMarkdown('a', '---\nname: a\ndescription: Decide pallet restocking.\n---\n'),
        makeSkillFromMarkdown(
          'b',
          '---\nname: b\ndescription: Decide shipping delay escalation routing.\n---\n',
        ),
      ],
    });
    expect(codsy021SimilarDescriptions(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails two skills with near-identical descriptions, flagging both files', () => {
    const description = 'Decide whether an inbound lead should be escalated to a senior rep.';
    const project = makeProject({
      skills: [
        makeSkillFromMarkdown('a', `---\nname: a\ndescription: ${description}\n---\n`),
        makeSkillFromMarkdown('b', `---\nname: b\ndescription: ${description}\n---\n`),
      ],
    });
    const diagnostics = codsy021SimilarDescriptions(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(2);
    expect(new Set(diagnostics.map((d) => d.file))).toEqual(
      new Set(['skills/a/SKILL.md', 'skills/b/SKILL.md']),
    );
  });

  it('respects a lower configured threshold', () => {
    const project = makeProject({
      skills: [
        makeSkillFromMarkdown(
          'a',
          '---\nname: a\ndescription: Decide pallet restocking now.\n---\n',
        ),
        makeSkillFromMarkdown(
          'b',
          '---\nname: b\ndescription: Decide shipping delay escalation routing now.\n---\n',
        ),
      ],
    });
    const config = mergeConfig({ descriptionSimilarityThreshold: 0.1 });
    expect(codsy021SimilarDescriptions(project, config)).toHaveLength(2);
  });
});

describe('CODSY030 vague statement', () => {
  it('passes a Decision logic section with concrete, numeric rules', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Decision logic\n\nEscalate accounts that have waited more than 2 hours.\n',
    );
    expect(codsy030VagueStatement(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails a vague statement in Decision logic with no concrete reference', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Decision logic\n\nRoute large customers to senior support.\n',
    );
    const diagnostics = codsy030VagueStatement(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
    expect(diagnostics[0]?.message).toContain('large customer');
  });

  it('fails a vague statement in Exceptions', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Exceptions\n\nUse good judgment for edge cases.\n',
    );
    const diagnostics = codsy030VagueStatement(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
  });

  it('is a false-positive trap: a vague phrase next to a number is exempt', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Decision logic\n\nPrioritize tickets that have waited more than 2 hours.\n',
    );
    expect(codsy030VagueStatement(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });

  it('is a false-positive trap: a vague phrase next to a backtick reference is exempt', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Decision logic\n\nEscalate to `senior_support` when appropriate.\n',
    );
    expect(codsy030VagueStatement(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });

  it('respects extensions to the vague-terms dictionary', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Decision logic\n\nHandle this the usual way.\n',
    );
    const withoutExtension = codsy030VagueStatement(
      makeProject({ skills: [skill] }),
      DEFAULT_CONFIG,
    );
    expect(withoutExtension).toEqual([]);

    const config = mergeConfig({ vagueTermsExtensions: ['the usual way'] });
    expect(codsy030VagueStatement(makeProject({ skills: [skill] }), config)).toHaveLength(1);
  });

  it('does not flag sections outside Decision logic and Exceptions', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Purpose\n\nPrioritize this when appropriate.\n',
    );
    expect(codsy030VagueStatement(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });
});

describe('skillQualityRules integration', () => {
  it('reports every rule across a realistic project, with the well-formed skill clean', async () => {
    const dir = join(FIXTURES_DIR, 'project-skill-quality');
    const config = await loadConfig(dir);
    const project = await loadProject(dir);
    const diagnostics = runRules(skillQualityRules, project, config);

    expect(diagnostics.filter((d) => d.file.includes('short-skill'))).toEqual([]);

    const ruleIds = new Set(diagnostics.map((d) => d.ruleId));
    expect(ruleIds).toEqual(new Set(['CODSY020', 'CODSY021', 'CODSY030']));
  });
});
