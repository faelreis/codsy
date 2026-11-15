import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/core/config';
import type { Project, Skill } from '../../src/core/project-loader';
import type { Rule } from '../../src/core/rule-engine';
import { runRules } from '../../src/core/rule-engine';

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

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    dirName: 'a',
    filePath: '/fake/skills/a/SKILL.md',
    relativePath: 'skills/a/SKILL.md',
    raw: '',
    files: [],
    frontmatter: {},
    frontmatterError: null,
    bodyStartLine: 1,
    sections: [],
    ...overrides,
  };
}

describe('runRules', () => {
  it('collects diagnostics from every rule', () => {
    const ruleA: Rule = () => [
      { ruleId: 'CODSY900', severity: 'warn', file: 'a.md', line: 1, message: 'a' },
    ];
    const ruleB: Rule = () => [
      { ruleId: 'CODSY901', severity: 'error', file: 'b.md', line: 1, message: 'b' },
    ];

    const diagnostics = runRules([ruleA, ruleB], makeProject(), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(2);
  });

  it('drops a diagnostic suppressed by a matching inline ignore comment', () => {
    const raw = ['## Exceptions', '', '<!-- codsy-ignore CODSY012: none yet -->'].join('\n');
    const project = makeProject({ skills: [makeSkill({ raw })] });
    const rule: Rule = () => [
      {
        ruleId: 'CODSY012',
        severity: 'warn',
        file: 'skills/a/SKILL.md',
        line: 3,
        message: 'empty exceptions',
      },
    ];

    expect(runRules([rule], project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('keeps a diagnostic with no matching ignore comment', () => {
    const project = makeProject({ skills: [makeSkill({ raw: '## Exceptions\n' })] });
    const rule: Rule = () => [
      {
        ruleId: 'CODSY012',
        severity: 'warn',
        file: 'skills/a/SKILL.md',
        line: 1,
        message: 'empty exceptions',
      },
    ];

    expect(runRules([rule], project, DEFAULT_CONFIG)).toHaveLength(1);
  });
});
