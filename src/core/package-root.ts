import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_WALK_UP = 5;

export function findPackageRootFromDir(startDir: string): string {
  let dir = startDir;

  for (let i = 0; i < MAX_WALK_UP; i += 1) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(`Unable to locate a package.json above ${startDir}`);
}

export function findPackageRoot(fromModuleUrl: string): string {
  return findPackageRootFromDir(dirname(fileURLToPath(fromModuleUrl)));
}
