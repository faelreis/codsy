import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '../../src/core/diagnostic';
import { formatRichText } from '../../src/ui/check-rich-format';

const DIAGNOSTICS: Diagnostic[] = [
  {
    ruleId: 'CODSY010',
    severity: 'error',
    file: 'skills/a/SKILL.md',
    line: 4,
    message: 'Missing the required Purpose section.',
    fixHint: "Add a '## Purpose' section.",
  },
  {
    ruleId: 'CODSY101',
    severity: 'warn',
    file: 'schemas/lead.schema.json',
    line: 1,
    message: "Property 'email' has no description.",
  },
];

describe('formatRichText', () => {
  it('groups diagnostics by file and includes the fix hint', () => {
    const text = formatRichText(DIAGNOSTICS, 'none');
    expect(text).toContain('skills/a/SKILL.md');
    expect(text).toContain('schemas/lead.schema.json');
    expect(text).toContain('CODSY010');
    expect(text).toContain('CODSY101');
    expect(text).toContain("Add a '## Purpose' section.");
  });

  it('reports a clean project without a file list', () => {
    const text = formatRichText([], 'none');
    expect(text).toBe('Everything checks out.\nNo further action needed.\n');
  });

  it('matches its colorized snapshot at truecolor', () => {
    expect(formatRichText(DIAGNOSTICS, 'truecolor')).toMatchSnapshot();
  });

  it('matches its plain snapshot when color is disabled', () => {
    expect(formatRichText(DIAGNOSTICS, 'none')).toMatchSnapshot();
  });

  it('emits no ANSI codes when color is disabled', () => {
    // eslint-disable-next-line no-control-regex -- matching a real ANSI escape byte is the point
    expect(formatRichText(DIAGNOSTICS, 'none')).not.toMatch(/\x1b\[/);
  });
});
