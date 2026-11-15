import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { listFilesRecursively } from '../../core/fs-helpers';

export const TEMPLATE_NAMES = ['blank', 'sales', 'support', 'finance'] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

export function isTemplateName(value: string | undefined): value is TemplateName {
  return value !== undefined && (TEMPLATE_NAMES as readonly string[]).includes(value);
}

export async function copyTemplate(
  templatesDir: string,
  templateName: TemplateName,
  destDir: string,
): Promise<void> {
  const sourceDir = join(templatesDir, templateName);
  const relativeFiles = await listFilesRecursively(sourceDir);

  for (const folder of ['schemas', 'skills', 'context', 'evals']) {
    await mkdir(join(destDir, folder), { recursive: true });
  }

  for (const relativeFile of relativeFiles) {
    if (relativeFile.endsWith('.gitkeep')) continue;

    const sourcePath = join(sourceDir, relativeFile);
    const destPath = join(destDir, relativeFile);
    await mkdir(dirname(destPath), { recursive: true });
    const content = await readFile(sourcePath);
    await writeFile(destPath, content);
  }
}
