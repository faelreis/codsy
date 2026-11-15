import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseCheckArgs, runCheckCommand } from '../../src/cli/check';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('parseCheckArgs', () => {
  it('defaults to non-strict and pretty format', () => {
    expect(parseCheckArgs([])).toEqual({ strict: false, format: 'pretty', invalidFormat: null });
  });

  it('parses --strict', () => {
    expect(parseCheckArgs(['--strict']).strict).toBe(true);
  });

  it('parses --format json and --format sarif', () => {
    expect(parseCheckArgs(['--format', 'json']).format).toBe('json');
    expect(parseCheckArgs(['--format', 'sarif']).format).toBe('sarif');
  });

  it('reports an unknown format instead of silently falling back', () => {
    expect(parseCheckArgs(['--format', 'yaml']).invalidFormat).toBe('yaml');
  });
});

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

describe('runCheckCommand', () => {
  it('exits 0 and reports a clean project', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runCheckCommand(['--format', 'json'], {
      rootDir: join(FIXTURES_DIR, 'project-check-strict'),
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(output.join('')) as { summary: { errorCount: number } };
    expect(parsed.summary.errorCount).toBe(0);
  });

  it('exits 1 when the project has rule violations', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runCheckCommand(['--format', 'json'], {
      rootDir: join(FIXTURES_DIR, 'project-security'),
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(1);
    const parsed = JSON.parse(output.join('')) as { summary: { errorCount: number } };
    expect(parsed.summary.errorCount).toBeGreaterThan(0);
  });

  it('reports that there is no Codsy project instead of a false-positive clean result', async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), 'codsy-check-no-project-'));
    const { write, output } = makeWriter();
    const exitCode = await runCheckCommand([], {
      rootDir: emptyDir,
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('No Codsy project found here.');
  });

  it('rejects an unknown format before loading the project', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runCheckCommand(['--format', 'yaml'], {
      rootDir: join(FIXTURES_DIR, 'project-security'),
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Unknown format');
  });

  it('uses the rich renderer only when interactive and format is pretty', async () => {
    let rendered = false;
    const { write } = makeWriter();
    await runCheckCommand([], {
      rootDir: join(FIXTURES_DIR, 'project-check-strict'),
      write,
      isInteractive: true,
      renderRichReport: () => {
        rendered = true;
        return Promise.resolve();
      },
    });

    expect(rendered).toBe(true);
  });

  it('falls back to plain output when interactive but format is json', async () => {
    let rendered = false;
    const { write, output } = makeWriter();
    await runCheckCommand(['--format', 'json'], {
      rootDir: join(FIXTURES_DIR, 'project-check-strict'),
      write,
      isInteractive: true,
      renderRichReport: () => {
        rendered = true;
        return Promise.resolve();
      },
    });

    expect(rendered).toBe(false);
    expect(() => JSON.parse(output.join('')) as unknown).not.toThrow();
  });

  it('escalates CODSY070 to an error under --strict', async () => {
    const { write: plainWrite, output: plainOutput } = makeWriter();
    const plainExit = await runCheckCommand(['--format', 'json'], {
      rootDir: join(FIXTURES_DIR, 'project-check-strict'),
      write: plainWrite,
      isInteractive: false,
    });

    const { write: strictWrite, output: strictOutput } = makeWriter();
    const strictExit = await runCheckCommand(['--format', 'json', '--strict'], {
      rootDir: join(FIXTURES_DIR, 'project-check-strict'),
      write: strictWrite,
      isInteractive: false,
    });

    expect(plainExit).toBe(0);
    const plainParsed = JSON.parse(plainOutput.join('')) as {
      diagnostics: Array<{ ruleId: string; severity: string }>;
    };
    expect(plainParsed.diagnostics).toEqual([
      expect.objectContaining({ ruleId: 'CODSY070', severity: 'warn' }),
    ]);

    expect(strictExit).toBe(1);
    const strictParsed = JSON.parse(strictOutput.join('')) as {
      diagnostics: Array<{ ruleId: string; severity: string }>;
    };
    expect(strictParsed.diagnostics).toEqual([
      expect.objectContaining({ ruleId: 'CODSY070', severity: 'error' }),
    ]);
  });
});
