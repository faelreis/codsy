import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../../../src/core/eval/build-prompt';
import type { ContextFile, SchemaFile, Skill } from '../../../src/core/project-loader';

function makeSkill(): Skill {
  return {
    dirName: 'lead-qualification',
    filePath: '/fake/skills/lead-qualification/SKILL.md',
    relativePath: 'skills/lead-qualification/SKILL.md',
    raw: '---\nname: lead-qualification\n---\n\n## Decision logic\n\nRoute big leads to sales.',
    files: [],
    frontmatter: { name: 'lead-qualification' },
    frontmatterError: null,
    bodyStartLine: 4,
    sections: [],
  };
}

function makeSchema(): SchemaFile {
  return {
    name: 'lead',
    filePath: '/fake/schemas/lead.schema.json',
    relativePath: 'schemas/lead.schema.json',
    raw: '{"type":"object"}',
    json: { type: 'object' },
    parseError: null,
  };
}

function makeContextFile(): ContextFile {
  return {
    name: 'company',
    filePath: '/fake/context/company.md',
    relativePath: 'context/company.md',
    raw: '# Company\n\nWe sell robots.',
  };
}

describe('buildPrompt', () => {
  it('includes the skill body, referenced schemas, context, and the input', () => {
    const prompt = buildPrompt(makeSkill(), [makeSchema()], [makeContextFile()], {
      company_size: 120,
    });

    expect(prompt).toContain('Route big leads to sales.');
    expect(prompt).toContain('"type":"object"');
    expect(prompt).toContain('We sell robots.');
    expect(prompt).toContain('"company_size": 120');
  });

  it('instructs the model to answer with JSON only', () => {
    const prompt = buildPrompt(makeSkill(), [], [], {});
    expect(prompt).toMatch(/JSON object/);
  });

  it('omits schema and context sections when there are none', () => {
    const prompt = buildPrompt(makeSkill(), [], [], { a: 1 });
    expect(prompt).not.toContain('## Schema:');
    expect(prompt).not.toContain('## Context:');
  });
});
