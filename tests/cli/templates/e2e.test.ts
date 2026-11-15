import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../../src/core/config';
import { loadProject } from '../../../src/core/project-loader';
import { runRules } from '../../../src/core/rule-engine';
import { findPackageRoot } from '../../../src/core/package-root';
import { ALL_RULES } from '../../../src/core/all-rules';
import { copyTemplate, TEMPLATE_NAMES } from '../../../src/cli/templates/copy-template';

const PACKAGE_ROOT = findPackageRoot(import.meta.url);
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

describe('template e2e: init then check', () => {
  it.each(TEMPLATE_NAMES)('"%s" template passes check with zero errors', async (templateName) => {
    const destDir = await mkdtemp(join(tmpdir(), `codsy-e2e-${templateName}-`));

    await copyTemplate(TEMPLATES_DIR, templateName, destDir);

    const config = await loadConfig(destDir);
    const project = await loadProject(destDir);
    const diagnostics = runRules(ALL_RULES, project, config);
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');

    expect(errors).toEqual([]);
  });

  it.each(TEMPLATE_NAMES)('"%s" template is also free of warnings', async (templateName) => {
    const destDir = await mkdtemp(join(tmpdir(), `codsy-e2e-warn-${templateName}-`));

    await copyTemplate(TEMPLATES_DIR, templateName, destDir);

    const config = await loadConfig(destDir);
    const project = await loadProject(destDir);
    const diagnostics = runRules(ALL_RULES, project, config);
    const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warn');

    expect(warnings).toEqual([]);
  });
});
