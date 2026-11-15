import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  copyTemplate,
  isTemplateName,
  TEMPLATE_NAMES,
} from '../../../src/cli/templates/copy-template';

async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

describe('isTemplateName', () => {
  it('accepts every declared template name', () => {
    for (const name of TEMPLATE_NAMES) {
      expect(isTemplateName(name)).toBe(true);
    }
  });

  it('rejects an unknown name and undefined', () => {
    expect(isTemplateName('nonexistent')).toBe(false);
    expect(isTemplateName(undefined)).toBe(false);
  });
});

describe('copyTemplate', () => {
  it('copies files from the source template into the destination, preserving structure', async () => {
    const templatesDir = await makeTempDir('codsy-templates-');
    const sourceDir = join(templatesDir, 'blank');
    await mkdir(join(sourceDir, 'skills', 'example'), { recursive: true });
    await writeFile(join(sourceDir, 'README.md'), 'hello');
    await writeFile(join(sourceDir, 'skills', 'example', 'SKILL.md'), 'skill content');

    const destDir = await makeTempDir('codsy-dest-');
    await copyTemplate(templatesDir, 'blank', destDir);

    expect(await readFile(join(destDir, 'README.md'), 'utf8')).toBe('hello');
    expect(await readFile(join(destDir, 'skills', 'example', 'SKILL.md'), 'utf8')).toBe(
      'skill content',
    );
  });

  it('skips .gitkeep placeholder files but still creates the standard folders', async () => {
    const templatesDir = await makeTempDir('codsy-templates-');
    const sourceDir = join(templatesDir, 'blank');
    await mkdir(join(sourceDir, 'schemas'), { recursive: true });
    await writeFile(join(sourceDir, 'schemas', '.gitkeep'), '');

    const destDir = await makeTempDir('codsy-dest-');
    await copyTemplate(templatesDir, 'blank', destDir);

    await expect(readFile(join(destDir, 'schemas', '.gitkeep'))).rejects.toThrow();
    const { stat } = await import('node:fs/promises');
    const schemasStat = await stat(join(destDir, 'schemas'));
    expect(schemasStat.isDirectory()).toBe(true);
  });

  it('always creates schemas, skills, context, and evals even when a template has no content for them', async () => {
    const templatesDir = await makeTempDir('codsy-templates-');
    await mkdir(join(templatesDir, 'blank'), { recursive: true });
    await writeFile(join(templatesDir, 'blank', 'README.md'), 'hello');

    const destDir = await makeTempDir('codsy-dest-');
    await copyTemplate(templatesDir, 'blank', destDir);

    const { stat } = await import('node:fs/promises');
    for (const folder of ['schemas', 'skills', 'context', 'evals']) {
      expect((await stat(join(destDir, folder))).isDirectory()).toBe(true);
    }
  });
});
