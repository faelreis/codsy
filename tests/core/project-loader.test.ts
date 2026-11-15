import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadProject } from '../../src/core/project-loader';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('loadProject', () => {
  it('loads schemas, skills, context files, and eval suites from a project', async () => {
    const project = await loadProject(join(FIXTURES_DIR, 'project-basic'));

    expect(project.schemas).toHaveLength(1);
    expect(project.schemas[0]?.name).toBe('lead');
    expect(project.schemas[0]?.parseError).toBeNull();

    expect(project.skills).toHaveLength(1);
    const skill = project.skills[0];
    expect(skill?.dirName).toBe('lead-qualification');
    expect(skill?.frontmatter.name).toBe('lead-qualification');
    expect(skill?.frontmatterError).toBeNull();
    expect(skill?.sections.map((section) => section.heading)).toContain('Purpose');

    expect(project.contextFiles).toHaveLength(1);
    expect(project.contextFiles[0]?.name).toBe('company');

    expect(project.evalSuites).toHaveLength(1);
    expect(project.evalSuites[0]?.skill).toBe('lead-qualification');
    expect(project.evalSuites[0]?.cases).toHaveLength(2);
  });

  it('returns empty collections when none of the expected folders exist', async () => {
    const project = await loadProject(join(FIXTURES_DIR, 'project-empty'));
    expect(project.schemas).toEqual([]);
    expect(project.skills).toEqual([]);
    expect(project.contextFiles).toEqual([]);
    expect(project.evalSuites).toEqual([]);
  });

  it('records parse errors instead of throwing on malformed files', async () => {
    const project = await loadProject(join(FIXTURES_DIR, 'project-malformed'));

    expect(project.schemas[0]?.parseError).toBeTruthy();
    expect(project.skills[0]?.frontmatterError).toMatch(/closing/);
    expect(project.evalSuites[0]?.parseError).toBeTruthy();
  });
});
