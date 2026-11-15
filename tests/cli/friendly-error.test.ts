import { describe, expect, it } from 'vitest';
import { formatFriendlyError } from '../../src/cli/friendly-error';

describe('formatFriendlyError', () => {
  it('includes what happened, how to fix, and a retry command', () => {
    const text = formatFriendlyError(new Error('config.yaml is not valid YAML'), 'codsy check');
    expect(text).toContain('What happened: config.yaml is not valid YAML');
    expect(text).toContain('How to fix:');
    expect(text).toContain('Retry with: codsy check');
  });

  it('handles a thrown non-Error value without crashing', () => {
    const text = formatFriendlyError('a plain string failure', 'codsy init');
    expect(text).toContain('What happened: a plain string failure');
  });
});
