import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findPackageRootFromDir } from '../../src/core/package-root';

describe('findPackageRootFromDir', () => {
  let tempDirs: string[] = [];

  afterEach(() => {
    tempDirs = [];
  });

  async function makeTempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'codsy-package-root-'));
    tempDirs.push(dir);
    return dir;
  }

  it('returns the starting directory when it has a package.json', async () => {
    const root = await makeTempDir();
    await writeFile(join(root, 'package.json'), '{}');
    expect(findPackageRootFromDir(root)).toBe(root);
  });

  it('walks up through nested directories to find package.json', async () => {
    const root = await makeTempDir();
    await writeFile(join(root, 'package.json'), '{}');
    const nested = join(root, 'a', 'b', 'c');
    await mkdir(nested, { recursive: true });
    expect(findPackageRootFromDir(nested)).toBe(root);
  });

  it('throws when no package.json is found within the walk-up limit', async () => {
    const root = await makeTempDir();
    expect(() => findPackageRootFromDir(root)).toThrow();
  });
});
