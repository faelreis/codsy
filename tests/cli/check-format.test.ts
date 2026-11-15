import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '../../src/core/diagnostic';
import {
  formatJson,
  formatPlainText,
  formatReport,
  formatSarif,
  nextStepLine,
  summarize,
  summaryLine,
} from '../../src/cli/check-format';

const ERROR: Diagnostic = {
  ruleId: 'CODSY010',
  severity: 'error',
  file: 'skills/a/SKILL.md',
  line: 4,
  message: 'Missing the required Purpose section.',
  fixHint: "Add a '## Purpose' section.",
};

const WARNING: Diagnostic = {
  ruleId: 'CODSY012',
  severity: 'warn',
  file: 'skills/a/SKILL.md',
  line: 10,
  message: 'Exceptions section is empty.',
};

const OTHER_FILE_WARNING: Diagnostic = {
  ruleId: 'CODSY101',
  severity: 'warn',
  file: 'schemas/lead.schema.json',
  line: 1,
  message: "Property 'email' has no description.",
};

describe('summarize', () => {
  it('counts errors and warnings separately', () => {
    expect(summarize([ERROR, WARNING, OTHER_FILE_WARNING])).toEqual({
      errorCount: 1,
      warnCount: 2,
    });
  });

  it('returns zero counts for an empty list', () => {
    expect(summarize([])).toEqual({ errorCount: 0, warnCount: 0 });
  });
});

describe('summaryLine', () => {
  it('reports a clean project', () => {
    expect(summaryLine({ errorCount: 0, warnCount: 0 })).toBe('Everything checks out.');
  });

  it('pluralizes singular counts correctly', () => {
    expect(summaryLine({ errorCount: 1, warnCount: 1 })).toBe('1 thing to fix, 1 suggestion.');
  });

  it('pluralizes plural counts correctly', () => {
    expect(summaryLine({ errorCount: 3, warnCount: 2 })).toBe('3 things to fix, 2 suggestions.');
  });
});

describe('nextStepLine', () => {
  it('points at errors first', () => {
    expect(nextStepLine({ errorCount: 1, warnCount: 1 })).toMatch(/errors/);
  });

  it('mentions suggestions when there are no errors', () => {
    expect(nextStepLine({ errorCount: 0, warnCount: 1 })).toMatch(/suggestions/);
  });

  it('says nothing further is needed on a clean project', () => {
    expect(nextStepLine({ errorCount: 0, warnCount: 0 })).toBe('No further action needed.');
  });
});

describe('formatPlainText', () => {
  it('groups diagnostics by file and includes the fix hint', () => {
    const text = formatPlainText([ERROR, WARNING]);
    expect(text).toContain('skills/a/SKILL.md');
    expect(text).toContain('ERROR CODSY010 line 4');
    expect(text).toContain("Fix: Add a '## Purpose' section.");
    expect(text).toContain('WARN CODSY012 line 10');
    expect(text).toContain('1 thing to fix, 1 suggestion.');
  });

  it('reports a clean project with no file sections', () => {
    const text = formatPlainText([]);
    expect(text).toBe('Everything checks out.\nNo further action needed.\n');
  });

  it('is byte-stable across repeated calls with the same input', () => {
    expect(formatPlainText([ERROR, WARNING])).toBe(formatPlainText([ERROR, WARNING]));
  });

  it('preserves a very long file path and message without truncating them', () => {
    const longPath = `skills/${'a'.repeat(40)}/${'b'.repeat(80)}/SKILL.md`;
    const longMessage = `This sentence is unusually long. ${'word '.repeat(60).trim()}.`;
    const diagnostic: Diagnostic = {
      ruleId: 'CODSY030',
      severity: 'warn',
      file: longPath,
      line: 1,
      message: longMessage,
    };

    const text = formatPlainText([diagnostic]);
    expect(text).toContain(longPath);
    expect(text).toContain(longMessage);
  });
});

describe('formatJson', () => {
  it('produces parseable JSON with diagnostics and a summary', () => {
    const parsed = JSON.parse(formatJson([ERROR, WARNING])) as {
      diagnostics: Diagnostic[];
      summary: { errorCount: number; warnCount: number };
    };
    expect(parsed.diagnostics).toHaveLength(2);
    expect(parsed.summary).toEqual({ errorCount: 1, warnCount: 1 });
  });

  it('is byte-stable across repeated calls with the same input', () => {
    expect(formatJson([ERROR])).toBe(formatJson([ERROR]));
  });
});

describe('formatSarif', () => {
  it('produces a valid-shaped SARIF 2.1.0 log', () => {
    const parsed = JSON.parse(formatSarif([ERROR, WARNING])) as {
      version: string;
      runs: Array<{ results: Array<{ ruleId: string; level: string }> }>;
    };
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs[0]?.results).toHaveLength(2);
    expect(parsed.runs[0]?.results[0]).toMatchObject({ ruleId: 'CODSY010', level: 'error' });
    expect(parsed.runs[0]?.results[1]).toMatchObject({ ruleId: 'CODSY012', level: 'warning' });
  });
});

describe('formatReport', () => {
  it('dispatches to the right formatter for each format', () => {
    expect(formatReport([ERROR], 'json')).toBe(formatJson([ERROR]));
    expect(formatReport([ERROR], 'sarif')).toBe(formatSarif([ERROR]));
    expect(formatReport([ERROR], 'pretty')).toBe(formatPlainText([ERROR]));
  });
});
