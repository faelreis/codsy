import { describe, expect, it } from 'vitest';
import { CommandProvider } from '../../../src/core/eval/command-provider';
import { ProviderConfigError } from '../../../src/core/eval/provider';

const ECHO_STDIN_COMMAND = `node -e "process.stdin.pipe(process.stdout)"`;

describe('CommandProvider', () => {
  it('throws a config error when no command is configured', async () => {
    const provider = new CommandProvider(null);
    await expect(provider.send('hello')).rejects.toThrow(ProviderConfigError);
  });

  it('writes the prompt to stdin and returns the command stdout', async () => {
    const provider = new CommandProvider(ECHO_STDIN_COMMAND);
    const response = await provider.send('hello from the eval runner');
    expect(response).toBe('hello from the eval runner');
  });

  it('rejects when the command exits with a non-zero code', async () => {
    const provider = new CommandProvider('node -e "process.exit(1)"');
    await expect(provider.send('hello')).rejects.toThrow(/exited with code 1/);
  });
});
