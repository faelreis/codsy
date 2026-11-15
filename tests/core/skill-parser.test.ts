import { describe, expect, it } from 'vitest';
import { parseSkillMarkdown } from '../../src/core/skill-parser';

const VALID_SKILL_LINES = [
  '---',
  'name: lead-qualification',
  'description: Decide whether a lead goes to sales.',
  'metadata:',
  '  owner: sales-ops',
  '  last_reviewed: 2026-10-01',
  '  review_every_days: 90',
  '  schemas:',
  '    - lead',
  '---',
  '',
  '## Purpose',
  '',
  'Qualify leads.',
  '',
  '## Decision logic',
  '',
  'Route big leads to sales.',
  '',
  '### Edge case',
  '',
  'Small leads go to nurture.',
  '',
  '## Exceptions',
  '',
  'None yet.',
];
const VALID_SKILL = VALID_SKILL_LINES.join('\n');

describe('parseSkillMarkdown', () => {
  it('parses the frontmatter fields', () => {
    const { frontmatter, frontmatterError } = parseSkillMarkdown(VALID_SKILL);
    expect(frontmatterError).toBeNull();
    expect(frontmatter.name).toBe('lead-qualification');
    expect(frontmatter.metadata?.owner).toBe('sales-ops');
    expect(frontmatter.metadata?.review_every_days).toBe(90);
    expect(frontmatter.metadata?.schemas).toEqual(['lead']);
  });

  it('builds a nested section tree with line numbers', () => {
    const { sections } = parseSkillMarkdown(VALID_SKILL);
    expect(sections.map((section) => section.heading)).toEqual([
      'Purpose',
      'Decision logic',
      'Exceptions',
    ]);

    const [purpose, decisionLogic, exceptions] = sections;
    expect(purpose?.line).toBe(12);
    expect(purpose?.body).toBe('Qualify leads.');

    expect(decisionLogic?.line).toBe(16);
    expect(decisionLogic?.body).toBe('Route big leads to sales.');
    expect(decisionLogic?.children).toHaveLength(1);
    expect(decisionLogic?.children[0]?.heading).toBe('Edge case');
    expect(decisionLogic?.children[0]?.line).toBe(20);

    expect(exceptions?.line).toBe(24);
    expect(exceptions?.body).toBe('None yet.');
  });

  it('reports a missing closing fence', () => {
    const { frontmatterError, bodyStartLine } = parseSkillMarkdown(
      '---\nname: broken\n\n## Purpose\n',
    );
    expect(frontmatterError).toMatch(/closing/);
    expect(bodyStartLine).toBe(1);
  });

  it('reports invalid YAML inside the frontmatter', () => {
    const raw = '---\nname: [unterminated\n---\n\n## Purpose\n';
    const { frontmatterError } = parseSkillMarkdown(raw);
    expect(frontmatterError).toMatch(/not valid YAML/);
  });

  it('treats a file with no frontmatter fence as having none', () => {
    const { frontmatterError, frontmatter } = parseSkillMarkdown(
      '## Purpose\n\nNo frontmatter here.\n',
    );
    expect(frontmatterError).toMatch(/Missing/);
    expect(frontmatter).toEqual({});
  });
});
