import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../core/config';
import { createProvider } from '../core/eval/create-provider';
import { buildPrompt } from '../core/eval/build-prompt';
import { evalSkill, type SkillEvalResult } from '../core/eval/run-eval';
import { loadProject, type Project, type Skill } from '../core/project-loader';

const NO_PROJECT_MESSAGE = 'No Codsy project found here. Run codsy init to start one.\n';

export interface EvalArgs {
  skillName: string | null;
  threshold: number | null;
  dryRun: boolean;
  invalidThreshold: string | null;
}

export function parseEvalArgs(argv: string[]): EvalArgs {
  let skillName: string | null = null;
  let threshold: number | null = null;
  let dryRun = false;
  let invalidThreshold: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--threshold') {
      const value = argv[i + 1];
      const parsed = value === undefined ? NaN : Number(value);
      if (Number.isFinite(parsed)) {
        threshold = parsed;
      } else {
        invalidThreshold = value ?? '';
      }
      i += 1;
    } else if (arg !== undefined && !arg.startsWith('--') && skillName === null) {
      skillName = arg;
    }
  }

  return { skillName, threshold, dryRun, invalidThreshold };
}

function schemasForSkill(skill: Skill, project: Project) {
  const names = new Set(
    Array.isArray(skill.frontmatter.metadata?.schemas) ? skill.frontmatter.metadata.schemas : [],
  );
  return project.schemas.filter((schema) => names.has(schema.name));
}

function skillsToEvaluate(project: Project, skillName: string | null): Skill[] {
  if (skillName) {
    return project.skills.filter((skill) => skill.dirName === skillName);
  }
  return project.skills.filter((skill) =>
    project.evalSuites.some((suite) => suite.skill === skill.dirName && suite.cases.length > 0),
  );
}

function accuracyBar(accuracy: number, width = 20): string {
  const filled = Math.round(accuracy * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function formatEvalReport(results: SkillEvalResult[], threshold: number): string {
  if (results.length === 0) {
    return 'No skills with eval cases were found.\n';
  }

  const lines: string[] = [];
  for (const result of results) {
    const percent = Math.round(result.accuracy * 100);
    lines.push(`${result.skillName}: ${accuracyBar(result.accuracy)} ${percent}%`);

    for (const caseResult of result.caseResults.filter((c) => !c.passed)) {
      lines.push(`  FAIL ${caseResult.id}`);
      lines.push(`    expected: ${JSON.stringify(caseResult.expected)}`);
      lines.push(`    actual:   ${JSON.stringify(caseResult.actual)}`);
      if (caseResult.error) lines.push(`    error:    ${caseResult.error}`);
    }
  }

  lines.push('');
  const belowThreshold = results.filter((r) => r.accuracy < threshold);
  if (belowThreshold.length > 0) {
    lines.push(
      `${belowThreshold.length} skill(s) scored below the ${Math.round(threshold * 100)}% threshold.`,
    );
  } else {
    lines.push(`Every skill meets the ${Math.round(threshold * 100)}% threshold.`);
  }

  return `${lines.join('\n')}\n`;
}

export function formatDryRunPrompts(skills: Skill[], project: Project): string {
  const lines: string[] = [];
  for (const skill of skills) {
    const suite = project.evalSuites.find((s) => s.skill === skill.dirName);
    const schemas = schemasForSkill(skill, project);
    for (const caseData of suite?.cases ?? []) {
      lines.push(`--- ${skill.dirName} / ${caseData.id} ---`);
      lines.push(buildPrompt(skill, schemas, project.contextFiles, caseData.input));
      lines.push('');
    }
  }
  return `${lines.join('\n')}\n`;
}

export interface RunEvalCommandOptions {
  rootDir: string;
  write: (text: string) => void;
}

export async function runEvalCommand(
  argv: string[],
  options: RunEvalCommandOptions,
): Promise<number> {
  const { skillName, threshold, dryRun, invalidThreshold } = parseEvalArgs(argv);

  if (invalidThreshold !== null) {
    options.write(`Invalid threshold "${invalidThreshold}". Pass a number like 0.8.\n`);
    return 1;
  }

  if (!existsSync(join(options.rootDir, 'codsy.config.yaml'))) {
    options.write(NO_PROJECT_MESSAGE);
    return 1;
  }

  const config = await loadConfig(options.rootDir);
  const project = await loadProject(options.rootDir);
  const effectiveThreshold = threshold ?? config.eval.threshold;
  const skills = skillsToEvaluate(project, skillName);

  if (skills.length === 0) {
    options.write(
      skillName
        ? `No skill named "${skillName}" with eval cases was found.\n`
        : 'No skills with eval cases were found.\n',
    );
    return 1;
  }

  if (dryRun) {
    options.write(formatDryRunPrompts(skills, project));
    return 0;
  }

  const provider = createProvider(config.eval);
  const results: SkillEvalResult[] = [];
  for (const skill of skills) {
    const suite = project.evalSuites.find((s) => s.skill === skill.dirName);
    const schemas = schemasForSkill(skill, project);
    results.push(
      await evalSkill(skill, schemas, project.contextFiles, suite?.cases ?? [], provider),
    );
  }

  options.write(formatEvalReport(results, effectiveThreshold));
  return results.some((r) => r.accuracy < effectiveThreshold) ? 1 : 0;
}
