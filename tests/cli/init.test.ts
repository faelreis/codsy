import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatInitSuccess, parseInitArgs, runInit } from '../../src/cli/init';

describe('formatInitSuccess', () => {
  const cwd = join(tmpdir(), 'codsy-cwd');

  it('names the current folder and skips cd when the project is created here', () => {
    for (const dir of ['.', './', cwd]) {
      expect(formatInitSuccess('sales', dir, cwd)).toBe(
        'Created a sales Codsy project in the current folder.\nNext: codsy check\n',
      );
    }
  });

  it('names the folder and suggests cd when the project is created elsewhere', () => {
    expect(formatInitSuccess('sales', 'my-project', cwd)).toBe(
      'Created a sales Codsy project in my-project.\nNext: cd my-project && codsy check\n',
    );
  });
});

describe('parseInitArgs', () => {
  it('defaults to the current directory and no template', () => {
    expect(parseInitArgs([])).toEqual({ dir: '.', template: null, invalidTemplate: null });
  });

  it('parses a positional directory', () => {
    expect(parseInitArgs(['my-project'])).toEqual({
      dir: 'my-project',
      template: null,
      invalidTemplate: null,
    });
  });

  it('parses --template', () => {
    expect(parseInitArgs(['--template', 'sales'])).toEqual({
      dir: '.',
      template: 'sales',
      invalidTemplate: null,
    });
  });

  it('parses a directory and --template together, in either order', () => {
    expect(parseInitArgs(['my-project', '--template', 'support'])).toEqual({
      dir: 'my-project',
      template: 'support',
      invalidTemplate: null,
    });
    expect(parseInitArgs(['--template', 'support', 'my-project'])).toEqual({
      dir: 'my-project',
      template: 'support',
      invalidTemplate: null,
    });
  });

  it('reports an unknown template name instead of silently ignoring it', () => {
    expect(parseInitArgs(['--template', 'nonexistent'])).toEqual({
      dir: '.',
      template: null,
      invalidTemplate: 'nonexistent',
    });
  });
});

describe('runInit', () => {
  async function makeTempTemplatesDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'codsy-templates-'));
    await mkdir(join(dir, 'blank'), { recursive: true });
    await writeFile(join(dir, 'blank', 'README.md'), 'hello');
    return dir;
  }

  function makeWriter(): { write: (text: string) => void; output: string[] } {
    const output: string[] = [];
    return { write: (text) => output.push(text), output };
  }

  it('copies the requested template and reports the next command', async () => {
    const templatesDir = await makeTempTemplatesDir();
    const destDir = await mkdtemp(join(tmpdir(), 'codsy-dest-'));
    const { write, output } = makeWriter();

    const exitCode = await runInit(['--template', 'blank', destDir], {
      templatesDir,
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Created a blank Codsy project');
    expect(output.join('')).toContain('codsy check');
  });

  it('fails with a plain-language error for an unknown template', async () => {
    const templatesDir = await makeTempTemplatesDir();
    const { write, output } = makeWriter();

    const exitCode = await runInit(['--template', 'nonexistent'], {
      templatesDir,
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Unknown template');
  });

  it('fails with guidance when no template is given and the terminal is not interactive', async () => {
    const templatesDir = await makeTempTemplatesDir();
    const { write, output } = makeWriter();

    const exitCode = await runInit([], { templatesDir, write, isInteractive: false });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('--template');
  });

  it('uses the interactive prompt when no template is given and the terminal is interactive', async () => {
    const templatesDir = await makeTempTemplatesDir();
    const destDir = await mkdtemp(join(tmpdir(), 'codsy-dest-'));
    const { write, output } = makeWriter();

    const exitCode = await runInit([destDir], {
      templatesDir,
      write,
      isInteractive: true,
      promptForTemplate: () => Promise.resolve('blank'),
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Created a blank Codsy project');
  });

  it('cancels cleanly when the interactive prompt returns null', async () => {
    const templatesDir = await makeTempTemplatesDir();
    const { write, output } = makeWriter();

    const exitCode = await runInit([], {
      templatesDir,
      write,
      isInteractive: true,
      promptForTemplate: () => Promise.resolve(null),
    });

    expect(exitCode).toBe(1);
    expect(output.join('')).toContain('Cancelled');
  });
});
