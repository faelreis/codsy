import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, mergeConfig } from '../../src/core/config';
import { loadProject } from '../../src/core/project-loader';
import type { EvalSuite, Project, SchemaFile, Skill } from '../../src/core/project-loader';
import { runRules } from '../../src/core/rule-engine';
import {
  codsy100InvalidSchema,
  codsy101MissingPropertyDescription,
  codsy102TooManyRequiredFields,
  codsy103UndocumentedEnum,
  codsy104MissingSchemaReference,
  codsy105EvalInputFailsSchema,
  schemaRules,
} from '../../src/rules/schema-rules';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

function makeSchema(overrides: Partial<SchemaFile> = {}): SchemaFile {
  return {
    name: 'test',
    filePath: '/fake/schemas/test.schema.json',
    relativePath: 'schemas/test.schema.json',
    raw: '{}',
    json: {},
    parseError: null,
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

describe('CODSY100 invalid against meta-schema', () => {
  it('passes a schema that validates against the 2020-12 meta-schema', () => {
    const project = makeProject({ schemas: [makeSchema({ json: { type: 'object' } })] });
    expect(codsy100InvalidSchema(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails a schema with an invalid "type" keyword', () => {
    const project = makeProject({ schemas: [makeSchema({ json: { type: 'object-ish' } })] });
    const diagnostics = codsy100InvalidSchema(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.ruleId).toBe('CODSY100');
    expect(diagnostics[0]?.severity).toBe('error');
  });

  it('fails a schema file that could not be parsed as JSON', () => {
    const project = makeProject({
      schemas: [makeSchema({ json: undefined, parseError: 'Unexpected end of JSON input' })],
    });
    const diagnostics = codsy100InvalidSchema(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toMatch(/not valid JSON/);
  });

  it('is skipped entirely when the rule is turned off', () => {
    const config = mergeConfig({ severities: { CODSY100: 'off' } });
    const project = makeProject({ schemas: [makeSchema({ json: { type: 'object-ish' } })] });
    expect(codsy100InvalidSchema(project, config)).toEqual([]);
  });
});

describe('CODSY101 property without description', () => {
  it('passes when every property has a description', () => {
    const project = makeProject({
      schemas: [
        makeSchema({ json: { properties: { a: { type: 'string', description: 'A field.' } } } }),
      ],
    });
    expect(codsy101MissingPropertyDescription(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when a property has no description', () => {
    const project = makeProject({
      schemas: [makeSchema({ json: { properties: { a: { type: 'string' } } } })],
    });
    const diagnostics = codsy101MissingPropertyDescription(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('properties.a');
    expect(diagnostics[0]?.severity).toBe('warn');
  });
});

describe('CODSY102 too many required fields', () => {
  it('passes when required stays within the configured limit', () => {
    const project = makeProject({ schemas: [makeSchema({ json: { required: ['a', 'b'] } })] });
    expect(codsy102TooManyRequiredFields(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when required exceeds the default limit of 8', () => {
    const project = makeProject({
      schemas: [makeSchema({ json: { required: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] } })],
    });
    const diagnostics = codsy102TooManyRequiredFields(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('9 fields');
  });

  it('respects a configured limit lower than the default', () => {
    const config = mergeConfig({ maxRequiredSchemaFields: 2 });
    const project = makeProject({ schemas: [makeSchema({ json: { required: ['a', 'b', 'c'] } })] });
    expect(codsy102TooManyRequiredFields(project, config)).toHaveLength(1);
  });
});

describe('CODSY103 enum without explanation of values', () => {
  it('passes when the enum has a description', () => {
    const project = makeProject({
      schemas: [makeSchema({ json: { enum: ['a', 'b'], description: 'a means X, b means Y.' } })],
    });
    expect(codsy103UndocumentedEnum(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when the enum has no description', () => {
    const project = makeProject({ schemas: [makeSchema({ json: { enum: ['a', 'b'] } })] });
    const diagnostics = codsy103UndocumentedEnum(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('warn');
  });
});

describe('CODSY104 skill references a missing schema', () => {
  it('passes when every referenced schema exists', () => {
    const project = makeProject({
      schemas: [makeSchema({ name: 'lead' })],
      skills: [makeSkill({ frontmatter: { metadata: { schemas: ['lead'] } } })],
    });
    expect(codsy104MissingSchemaReference(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when a referenced schema does not exist', () => {
    const project = makeProject({
      schemas: [],
      skills: [makeSkill({ dirName: 'a', frontmatter: { metadata: { schemas: ['ghost'] } } })],
    });
    const diagnostics = codsy104MissingSchemaReference(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.message).toContain('ghost');
  });
});

describe('CODSY105 eval input fails its schema', () => {
  const schema = makeSchema({
    name: 'lead',
    json: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] },
  });
  const skill = makeSkill({
    dirName: 'lead-qualification',
    frontmatter: { metadata: { schemas: ['lead'] } },
  });

  it('passes when every case input matches its schema', () => {
    const project = makeProject({
      schemas: [schema],
      skills: [skill],
      evalSuites: [
        makeEvalSuite({
          skill: 'lead-qualification',
          cases: [{ id: 'c1', source: 'synthetic', input: { email: 'a@b.com' }, expected: {} }],
        }),
      ],
    });
    expect(codsy105EvalInputFailsSchema(project, DEFAULT_CONFIG)).toEqual([]);
  });

  it('fails when a case input does not match its schema', () => {
    const project = makeProject({
      schemas: [schema],
      skills: [skill],
      evalSuites: [
        makeEvalSuite({
          skill: 'lead-qualification',
          cases: [{ id: 'c1', source: 'synthetic', input: {}, expected: {} }],
        }),
      ],
    });
    const diagnostics = codsy105EvalInputFailsSchema(project, DEFAULT_CONFIG);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe('error');
    expect(diagnostics[0]?.message).toContain('c1');
  });
});

describe('schemaRules integration', () => {
  it('reports every rule together against a realistic project', async () => {
    const project = await loadProject(join(FIXTURES_DIR, 'project-schema-rules'));
    const diagnostics = runRules(schemaRules, project, DEFAULT_CONFIG);
    const ruleIds = new Set(diagnostics.map((diagnostic) => diagnostic.ruleId));
    expect(ruleIds).toEqual(
      new Set(['CODSY100', 'CODSY101', 'CODSY102', 'CODSY103', 'CODSY104', 'CODSY105']),
    );
  });
});
