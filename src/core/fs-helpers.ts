import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Dirent } from 'node:fs';

export async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw error;
  }
}

export async function listDirectoryNames(dirPath: string): Promise<string[]> {
  return listEntries(dirPath, (entry) => entry.isDirectory());
}

export async function listFileNames(dirPath: string): Promise<string[]> {
  return listEntries(dirPath, (entry) => entry.isFile());
}

export async function listFilesRecursively(dirPath: string): Promise<string[]> {
  const result: string[] = [];

  async function walk(currentDir: string, prefix: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      if (isNotFoundError(error)) return;
      throw error;
    }

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(join(currentDir, entry.name), relativePath);
      } else if (entry.isFile()) {
        result.push(relativePath);
      }
    }
  }

  await walk(dirPath, '');
  return result;
}

async function listEntries(
  dirPath: string,
  predicate: (entry: Dirent) => boolean,
): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries.filter(predicate).map((entry) => entry.name);
  } catch (error) {
    if (isNotFoundError(error)) return [];
    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}
