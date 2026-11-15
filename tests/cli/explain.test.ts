import { describe, expect, it } from 'vitest';
import { runExplain } from '../../src/cli/explain';

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

describe('runExplain', () => {
  it('prints what, why, and how to fix for a known rule, in any case', () => {
    const { write, output } = makeWriter();
    const exitCode = runExplain(['codsy010'], write);

    expect(exitCode).toBe(0);
    const text = output.join('');
    expect(text).toContain('CODSY010');
    expect(text).toContain('Why this matters:');
    expect(text).toContain('How to fix:');
  });

  it('fails with a plain-language message for an unknown rule', () => {
    const { write, output } = makeWriter();
    const exitCode = runExplain(['CODSY999'], write);

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Unknown rule');
  });

  it('shows usage when no rule id is given', () => {
    const { write, output } = makeWriter();
    const exitCode = runExplain([], write);

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Usage:');
  });
});
