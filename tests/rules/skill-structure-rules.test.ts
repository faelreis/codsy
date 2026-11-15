import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, loadConfig, mergeConfig } from '../../src/core/config';
import { loadProject } from '../../src/core/project-loader';
import type { EvalSuite, Project, Skill } from '../../src/core/project-loader';
import { parseSkillMarkdown } from '../../src/core/skill-parser';
import { runRules } from '../../src/core/rule-engine';
import {
  codsy001InvalidFrontmatter,
  codsy002WeakDescription,
  codsy010MissingRequiredSections,
  codsy011TooFewExamples,
  codsy012EmptyExceptions,
  codsy050OwnerOrReview,
  codsy070InsufficientEvals,
  skillStructureRules,
} from '../../src/rules/skill-structure-rules';

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

function makeEvalSuite(overrides: Partial<EvalSuite> = {}): EvalSuite {
  return {
    skill: null,
    filePath: '/fake/evals/a/cases.yaml',
    relativePath: 'evals/a/cases.yaml',
    raw: '',
    cases: [],
    parseError: null,
    ...overrides,
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

const GOOD_SKILL_MARKDOWN = [
  '---',
  'name: a',
  'description: Decide something, used when something happens.',
  'metadata:',
  '  owner: ops',
  '---',
  '',
  '## Purpose',
  '',
  'Placeholder.',
  '',
  '## When to use',
  '',
  'Whenever something happens.',
  '',
  '## Input',
  '',
  'Some input.',
  '',
  '## Decision logic',
  '',
  'Some logic.',
  '',
  '## Exceptions',
  '',
  'None known.',
  '',
  '## Output',
  '',
  'Some output.',
  '',
  '## Examples',
  '',
  '1. First example.',
  '2. Second example.',
].join('\n');

describe('CODSY001 invalid frontmatter', () => {
  it('passes when the name matches the folder', () => {
    const project = makeProject({ skills: [makeSkillFromMarkdown('a', GOOD_SKILL_MARKDOWN)] });
    expect(codsy001InvalidFrontmatter(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when the frontmatter name does not match the folder', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      GOOD_SKILL_MARKDOWN.replace('name: a', 'name: wrong-name'),
    );
    const project = makeProject({ skills: [skill] });
    const diagnostics = codsy001InvalidFrontmatter(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.message).toContain('wrong-name');
  });

  it('fails when the frontmatter itself could not be parsed', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: broken\n\n## Purpose\n');
    const project = makeProject({ skills: [skill] });
    const diagnostics = codsy001InvalidFrontmatter(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toMatch(/closing/);
  });
});

describe('CODSY002 weak description', () => {
  it('passes a description that explains what and when', () => {
    const project = makeProject({ skills: [makeSkillFromMarkdown('a', GOOD_SKILL_MARKDOWN)] });
    expect(codsy002WeakDescription(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when the description is missing', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Purpose\n');
    const project = makeProject({ skills: [skill] });
    const diagnostics = codsy002WeakDescription(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('no description');
  });

  it('fails when the description is too short', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\ndescription: Too short.\n---\n');
    const diagnostics = codsy002WeakDescription(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('too short');
  });

  it('fails when the description never says when to use the skill', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\ndescription: Classifies inbound support tickets by urgency level.\n---\n',
    );
    const diagnostics = codsy002WeakDescription(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('when to use');
  });
});

describe('CODSY010 missing required sections', () => {
  it('passes when every required section is present', () => {
    const project = makeProject({ skills: [makeSkillFromMarkdown('a', GOOD_SKILL_MARKDOWN)] });
    expect(codsy010MissingRequiredSections(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails once per missing required section', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Purpose\n\nText.\n');
    const diagnostics = codsy010MissingRequiredSections(
      makeProject({ skills: [skill] }),
      DEFAULT_CONFIG,
    );
    expect(diagnostics).toHaveLength(DEFAULT_CONFIG.requiredSections.length - 1);
    expect(diagnostics.every((d) => d.severity === 'error')).toBe(true);
  });

  it('respects a configured list of required sections', () => {
    const config = mergeConfig({ requiredSections: ['Purpose'] });
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Purpose\n\nText.\n');
    expect(codsy010MissingRequiredSections(makeProject({ skills: [skill] }), config)).toEqual([]);
  });
});

describe('CODSY011 too few examples', () => {
  it('passes with at least two worked examples', () => {
    const project = makeProject({ skills: [makeSkillFromMarkdown('a', GOOD_SKILL_MARKDOWN)] });
    expect(codsy011TooFewExamples(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails with only one worked example', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Examples\n\n1. Only one.\n');
    const diagnostics = codsy011TooFewExamples(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.message).toContain('1 worked example');
  });

  it('fails when the Examples section is missing entirely', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Purpose\n\nText.\n');
    const diagnostics = codsy011TooFewExamples(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('0 worked example');
  });
});

describe('CODSY012 empty Exceptions', () => {
  it('passes when Exceptions has real content', () => {
    const project = makeProject({ skills: [makeSkillFromMarkdown('a', GOOD_SKILL_MARKDOWN)] });
    expect(codsy012EmptyExceptions(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when Exceptions has no content', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\n---\n\n## Exceptions\n\n## Output\n\nText.\n',
    );
    const diagnostics = codsy012EmptyExceptions(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
  });

  it('does not fire when the Exceptions section is missing entirely', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n\n## Purpose\n\nText.\n');
    expect(codsy012EmptyExceptions(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });

  it('is suppressed by an inline ignore comment anywhere in the same file', () => {
    const raw = '---\nname: a\n---\n\n## Exceptions\n\n<!-- codsy-ignore CODSY012: none yet -->\n';
    const project = makeProject({ skills: [makeSkillFromMarkdown('a', raw)] });
    expect(runRules([codsy012EmptyExceptions], project, DEFAULT_CONFIG)).toEqual([]);
  });
});

describe('CODSY050 missing owner or overdue review', () => {
  it('passes with an owner and a recent review', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      `---\nname: a\nmetadata:\n  owner: ops\n  last_reviewed: ${new Date().toISOString().slice(0, 10)}\n  review_every_days: 90\n---\n`,
    );
    expect(codsy050OwnerOrReview(makeProject({ skills: [skill] }), DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when the owner is missing', () => {
    const skill = makeSkillFromMarkdown('a', '---\nname: a\n---\n');
    const diagnostics = codsy050OwnerOrReview(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('no owner');
  });

  it('fails when the review is overdue', () => {
    const skill = makeSkillFromMarkdown(
      'a',
      '---\nname: a\nmetadata:\n  owner: ops\n  last_reviewed: 2000-01-01\n  review_every_days: 30\n---\n',
    );
    const diagnostics = codsy050OwnerOrReview(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('overdue');
  });
});

describe('CODSY070 insufficient evals', () => {
  it('passes when there are enough eval cases', () => {
    const skill = makeSkillFromMarkdown(
      'lead',
      GOOD_SKILL_MARKDOWN.replace('name: a', 'name: lead'),
    );
    const config = mergeConfig({ minEvalCases: 1 });
    const project = makeProject({
      skills: [skill],
      evalSuites: [
        makeEvalSuite({
          skill: 'lead',
          cases: [{ id: 'c1', source: 'synthetic', input: {}, expected: {} }],
        }),
      ],
    });
    expect(codsy070InsufficientEvals(project, config)).toEqual([]);
  });

  it('fails when a skill has no evals at all', () => {
    const skill = makeSkillFromMarkdown(
      'lead',
      GOOD_SKILL_MARKDOWN.replace('name: a', 'name: lead'),
    );
    const diagnostics = codsy070InsufficientEvals(makeProject({ skills: [skill] }), DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
    expect(diagnostics[0]?.message).toContain('no evals');
  });

  it('fails when a skill has fewer cases than the minimum', () => {
    const skill = makeSkillFromMarkdown(
      'lead',
      GOOD_SKILL_MARKDOWN.replace('name: a', 'name: lead'),
    );
    const config = mergeConfig({ minEvalCases: 5 });
    const project = makeProject({
      skills: [skill],
      evalSuites: [
        makeEvalSuite({
          skill: 'lead',
          cases: [{ id: 'c1', source: 'synthetic', input: {}, expected: {} }],
        }),
      ],
    });
    const diagnostics = codsy070InsufficientEvals(project, config);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('1 eval case');
  });

  it('defaults to error severity under --strict', () => {
    const skill = makeSkillFromMarkdown(
      'lead',
      GOOD_SKILL_MARKDOWN.replace('name: a', 'name: lead'),
    );
    const config = mergeConfig({ strict: true });
    const diagnostics = codsy070InsufficientEvals(makeProject({ skills: [skill] }), config);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('error');
  });
});

describe('skillStructureRules integration', () => {
  it('reports every rule across a realistic project, with the well-formed skill clean', async () => {
    const dir = join(FIXTURES_DIR, 'project-skill-structure');
    const config = await loadConfig(dir);
    const project = await loadProject(dir);
    const diagnostics = runRules(skillStructureRules, project, config);

    expect(diagnostics.filter((d) => d.file.includes('good-skill'))).toEqual([]);

    const ruleIds = new Set(diagnostics.map((d) => d.ruleId));
    expect(ruleIds).toEqual(
      new Set(['CODSY001', 'CODSY002', 'CODSY010', 'CODSY011', 'CODSY012', 'CODSY050', 'CODSY070']),
    );
  });
});
