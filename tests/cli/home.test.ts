import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  detectProjectStatus,
  formatPlainHome,
  HOME_MENU_ITEMS,
  runHomeCommand,
  statusLine,
} from '../../src/cli/home';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

describe('detectProjectStatus', () => {
  it('reports not in a project when codsy.config.yaml is missing', async () => {
    const status = await detectProjectStatus(join(FIXTURES_DIR, 'project-empty'));
    expect(status.inProject).toBe(false);
  });

  it('reports counts when inside a project', async () => {
    const status = await detectProjectStatus(join(FIXTURES_DIR, 'project-check-strict'));
    expect(status.inProject).toBe(true);
    expect(status.skillCount).toBe(1);
  });
});

describe('statusLine', () => {
  it('formats the counts in a fixed order', () => {
    expect(
      statusLine({ inProject: true, skillCount: 2, schemaCount: 1, contextFileCount: 6 }),
    ).toBe('2 skills · 1 schemas · 6 context files');
  });
});

describe('formatPlainHome', () => {
  it('omits the status line outside a project', () => {
    const text = formatPlainHome({
      inProject: false,
      skillCount: 0,
      schemaCount: 0,
      contextFileCount: 0,
    });
    expect(text).not.toContain('skills ·');
  });

  it('includes the status line and every menu command inside a project', () => {
    const text = formatPlainHome({
      inProject: true,
      skillCount: 1,
      schemaCount: 0,
      contextFileCount: 0,
    });
    expect(text).toContain('1 skills ·');
    for (const item of HOME_MENU_ITEMS) {
      expect(text).toContain(item.command);
    }
  });
});

describe('runHomeCommand', () => {
  it('writes plain text when not interactive', async () => {
    const { write, output } = makeWriter();
    const exitCode = await runHomeCommand({
      rootDir: join(FIXTURES_DIR, 'project-empty'),
      write,
      isInteractive: false,
    });

    expect(exitCode).toBe(0);
    expect(output.join('')).toContain('Codsy helps you');
  });

  it('uses the rich renderer when interactive', async () => {
    let rendered = false;
    const { write } = makeWriter();
    await runHomeCommand({
      rootDir: join(FIXTURES_DIR, 'project-empty'),
      write,
      isInteractive: true,
      renderRichHome: () => {
        rendered = true;
        return Promise.resolve();
      },
    });

    expect(rendered).toBe(true);
  });
});
