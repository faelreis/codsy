import { describe, expect, it } from 'vitest';
import { HELP_TEXT, isHelpRequest } from '../../src/cli/help';

describe('isHelpRequest', () => {
  it.each([['--help'], ['-h'], ['help']])('recognizes codsy %s', (arg) => {
    expect(isHelpRequest([arg])).toBe(true);
  });

  it('recognizes a help flag after a command, so codsy init --help does not create a folder', () => {
    expect(isHelpRequest(['init', '--help'])).toBe(true);
    expect(isHelpRequest(['eval', '-h'])).toBe(true);
  });

  it('ignores ordinary commands and no arguments', () => {
    expect(isHelpRequest([])).toBe(false);
    expect(isHelpRequest(['check', '--strict'])).toBe(false);
    expect(isHelpRequest(['init', 'help-desk'])).toBe(false);
  });
});

describe('HELP_TEXT', () => {
  it('lists every command', () => {
    for (const command of ['init', 'new skill', 'new schema', 'check', 'explain', 'eval']) {
      expect(HELP_TEXT).toContain(`codsy ${command}`);
    }
  });

  it('lists the template names', () => {
    expect(HELP_TEXT).toContain('blank, sales, support, finance');
  });

  it('uses a calm voice with no exclamation marks', () => {
    expect(HELP_TEXT).not.toContain('!');
  });
});
