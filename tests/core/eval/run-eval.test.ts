import { describe, expect, it } from 'vitest';
import { evalCase, evalSkill } from '../../../src/core/eval/run-eval';
import type { EvalProvider } from '../../../src/core/eval/provider';
import type { EvalCase, Skill } from '../../../src/core/project-loader';

function makeSkill(): Skill {
  return {
    dirName: 'lead-qualification',
    filePath: '/fake/skills/lead-qualification/SKILL.md',
    relativePath: 'skills/lead-qualification/SKILL.md',
    raw: '---\nname: lead-qualification\n---\n',
    files: [],
    frontmatter: { name: 'lead-qualification' },
    frontmatterError: null,
    bodyStartLine: 3,
    sections: [],
  };
}

function makeCase(overrides: Partial<EvalCase> = {}): EvalCase {
  return {
    id: 'case-1',
    source: 'synthetic',
    input: { company_size: 120 },
    expected: { decision: 'sales' },
    ...overrides,
  };
}

function fakeProvider(response: string | ((prompt: string) => string)): EvalProvider {
  return {
    send: (prompt) => Promise.resolve(typeof response === 'string' ? response : response(prompt)),
  };
}

function failingProvider(message: string): EvalProvider {
  return {
    send: () => Promise.reject(new Error(message)),
  };
}

describe('evalCase', () => {
  it('passes when the actual answer matches every declared field', async () => {
    const result = await evalCase(
      makeSkill(),
      [],
      [],
      makeCase(),
      fakeProvider('{"decision": "sales"}'),
    );
    expect(result.passed).toBe(true);
    expect(result.error).toBeNull();
  });

  it('fails when a declared field does not match', async () => {
    const result = await evalCase(
      makeSkill(),
      [],
      [],
      makeCase(),
      fakeProvider('{"decision": "nurture"}'),
    );
    expect(result.passed).toBe(false);
  });

  it('ignores extra fields the model returns beyond what was declared', async () => {
    const result = await evalCase(
      makeSkill(),
      [],
      [],
      makeCase(),
      fakeProvider('{"decision": "sales", "confidence": 0.9}'),
    );
    expect(result.passed).toBe(true);
  });

  it('fails when the response cannot be parsed as JSON', async () => {
    const result = await evalCase(makeSkill(), [], [], makeCase(), fakeProvider('not json'));
    expect(result.passed).toBe(false);
    expect(result.actual).toBeNull();
  });

  it('records the provider error without throwing', async () => {
    const result = await evalCase(
      makeSkill(),
      [],
      [],
      makeCase(),
      failingProvider('network is unavailable'),
    );
    expect(result.passed).toBe(false);
    expect(result.error).toBe('network is unavailable');
  });

  it('compares nested object and array fields deeply', async () => {
    const result = await evalCase(
      makeSkill(),
      [],
      [],
      makeCase({ expected: { route: { team: 'sales', tags: ['urgent', 'large'] } } }),
      fakeProvider('{"route": {"team": "sales", "tags": ["urgent", "large"]}}'),
    );
    expect(result.passed).toBe(true);
  });
});

describe('evalSkill', () => {
  it('computes accuracy as the fraction of passing cases', async () => {
    const cases = [
      makeCase({ id: 'a', input: { company_size: 1 }, expected: { decision: 'sales' } }),
      makeCase({ id: 'b', input: { company_size: 2 }, expected: { decision: 'sales' } }),
      makeCase({ id: 'c', input: { company_size: 3 }, expected: { decision: 'sales' } }),
      makeCase({ id: 'd', input: { company_size: 4 }, expected: { decision: 'sales' } }),
    ];
    const provider = fakeProvider((prompt) =>
      prompt.includes('"company_size": 4') ? '{"decision": "nurture"}' : '{"decision": "sales"}',
    );

    const result = await evalSkill(makeSkill(), [], [], cases, provider);

    expect(result.caseResults).toHaveLength(4);
    expect(result.accuracy).toBe(0.75);
    expect(result.caseResults.find((r) => r.id === 'd')?.passed).toBe(false);
  });

  it('reports perfect accuracy for a skill with no cases', async () => {
    const result = await evalSkill(makeSkill(), [], [], [], fakeProvider('{}'));
    expect(result.accuracy).toBe(1);
    expect(result.caseResults).toEqual([]);
  });
});
