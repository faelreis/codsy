import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '../../src/core/diagnostic';
import { filterIgnoredDiagnostics, parseIgnoreDirectives } from '../../src/core/ignore';

describe('parseIgnoreDirectives', () => {
  it('finds a directive with its line number and trimmed reason', () => {
    const raw = [
      '# Title',
      '',
      '<!-- codsy-ignore CODSY012: no exceptions yet -->',
      'More text',
    ].join('\n');

    expect(parseIgnoreDirectives(raw)).toEqual([
      { ruleId: 'CODSY012', reason: 'no exceptions yet', line: 3 },
    ]);
  });

  it('requires a non-empty reason', () => {
    expect(parseIgnoreDirectives('<!-- codsy-ignore CODSY012: -->')).toEqual([]);
  });

  it('ignores lines with no directive at all', () => {
    expect(parseIgnoreDirectives('nothing to see here')).toEqual([]);
  });
});

describe('filterIgnoredDiagnostics', () => {
  const makeDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
    ruleId: 'CODSY012',
    severity: 'warn',
    file: 'skills/a/SKILL.md',
    line: 3,
    message: 'Exceptions section is empty.',
    ...overrides,
  });

  it('removes a diagnostic matching a same-file, same-rule directive', () => {
    const raw = ['## Exceptions', '', '<!-- codsy-ignore CODSY012: none yet -->'].join('\n');
    const result = filterIgnoredDiagnostics(
      [makeDiagnostic()],
      new Map([['skills/a/SKILL.md', raw]]),
    );
    expect(result).toEqual([]);
  });

  it('removes a diagnostic even when it sits on a different line than the directive', () => {
    const raw = ['## Exceptions', '<!-- codsy-ignore CODSY012: none yet -->', ''].join('\n');
    const result = filterIgnoredDiagnostics(
      [makeDiagnostic({ line: 1 })],
      new Map([['skills/a/SKILL.md', raw]]),
    );
    expect(result).toEqual([]);
  });

  it('keeps a diagnostic for a different rule id', () => {
    const raw = '<!-- codsy-ignore CODSY099: unrelated -->';
    const result = filterIgnoredDiagnostics(
      [makeDiagnostic({ line: 1 })],
      new Map([['skills/a/SKILL.md', raw]]),
    );
    expect(result).toHaveLength(1);
  });

  it('keeps a diagnostic when the file has no raw content on record', () => {
    const result = filterIgnoredDiagnostics([makeDiagnostic()], new Map());
    expect(result).toHaveLength(1);
  });
});
