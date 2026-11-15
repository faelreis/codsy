import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isDirectInvocation, run } from '../../src/cli/index';

describe('run', () => {
  it('reports the installed version for --version', () => {
    expect(run(['--version'])).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('also accepts the short -v flag', () => {
    expect(run(['-v'])).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('reports the calm placeholder message with no arguments', () => {
    expect(run([])).toBe('Codsy is set up. Run codsy --version to see the installed version.');
  });
});

describe('isDirectInvocation', () => {
  const realPath = path.resolve('project', 'dist', 'cli.js');
  const moduleUrl = pathToFileURL(realPath).href;

  it('matches when the invoked path resolves to the module file, such as through an npm link symlink', () => {
    const symlinkPath = path.resolve('global-npm', 'node_modules', 'codsy', 'dist', 'cli.js');
    const resolveRealPath = (candidate: string): string =>
      candidate === symlinkPath ? realPath : candidate;

    expect(isDirectInvocation(symlinkPath, moduleUrl, resolveRealPath)).toBe(true);
  });

  it('does not match an unrelated invoked path', () => {
    const unrelatedPath = path.resolve('some', 'other', 'script.js');

    expect(isDirectInvocation(unrelatedPath, moduleUrl, (candidate) => candidate)).toBe(false);
  });

  it('does not match when there is no invoked path, such as when the module is only imported', () => {
    expect(isDirectInvocation(undefined, moduleUrl, (candidate) => candidate)).toBe(false);
  });
});
