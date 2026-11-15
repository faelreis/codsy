import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runInit } from '../../src/cli/init';
import { runNewSkill } from '../../src/cli/new-skill';
import { runCheckCommand } from '../../src/cli/check';
import { runEvalCommand } from '../../src/cli/eval';
import { findPackageRoot } from '../../src/core/package-root';

const PACKAGE_ROOT = findPackageRoot(import.meta.url);
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

function makeWriter(): { write: (text: string) => void; output: string[] } {
  const output: string[] = [];
  return { write: (text) => output.push(text), output };
}

describe('full flow: init, new skill, check, eval --dry-run', () => {
  it('runs end to end in a clean directory with no network access', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'codsy-e2e-full-flow-'));

    const initWriter = makeWriter();
    const initExit = await runInit(['--template', 'blank', projectDir], {
      templatesDir: TEMPLATES_DIR,
      write: initWriter.write,
      isInteractive: false,
    });
    expect(initExit).toBe(0);
    expect(initWriter.output.join('')).toContain('Created a blank Codsy project');

    const newSkillWriter = makeWriter();
    const newSkillExit = await runNewSkill(
      [
        '--name',
        'order-escalation',
        '--owner',
        'ops',
        '--purpose',
        'Decide whether an order should be escalated.',
        '--when-to-use',
        'an order is flagged as delayed.',
        '--input',
        'an order record.',
        '--decision-logic',
        'escalate orders delayed more than 3 days.',
        '--exceptions',
        'none known.',
        '--output',
        'a routing decision.',
        '--example',
        'a 5-day-delayed order escalates.',
        '--example',
        'a 1-day-delayed order does not escalate.',
      ],
      { rootDir: projectDir, write: newSkillWriter.write, isInteractive: false },
    );
    expect(newSkillExit).toBe(0);
    expect(newSkillWriter.output.join('')).toContain('Created skills/order-escalation/SKILL.md');

    const checkWriter = makeWriter();
    const checkExit = await runCheckCommand(['--format', 'json'], {
      rootDir: projectDir,
      write: checkWriter.write,
      isInteractive: false,
    });
    const checkReport = JSON.parse(checkWriter.output.join('')) as {
      diagnostics: Array<{ ruleId: string; severity: string }>;
    };
    expect(checkExit).toBe(0);
    expect(checkReport.diagnostics.every((d) => d.severity !== 'error')).toBe(true);

    const evalWriter = makeWriter();
    const evalExit = await runEvalCommand(['order-escalation', '--dry-run'], {
      rootDir: projectDir,
      write: evalWriter.write,
    });
    expect(evalExit).toBe(0);
    expect(evalWriter.output.join('').trim()).toBe('');
  });

  it('dry-runs real prompts for a template that ships with eval cases', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'codsy-e2e-full-flow-'));

    await runInit(['--template', 'sales', projectDir], {
      templatesDir: TEMPLATES_DIR,
      write: () => {},
      isInteractive: false,
    });

    const evalWriter = makeWriter();
    const evalExit = await runEvalCommand(['--dry-run'], {
      rootDir: projectDir,
      write: evalWriter.write,
    });

    expect(evalExit).toBe(0);
    const output = evalWriter.output.join('');
    expect(output).toContain('--- lead-qualification /');
    expect(output).toContain('Respond with a single JSON object');
  });
});
