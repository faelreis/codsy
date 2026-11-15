import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildEvalsStub, buildSkillMarkdown, type SkillAnswers } from './templates/skill-markdown';

const NO_PROJECT_MESSAGE = 'No Codsy project found here. Run codsy init to start one.\n';

function readFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  return argv[index + 1];
}

function readFlagList(argv: string[], flag: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === flag) {
      const value = argv[i + 1];
      if (value !== undefined) values.push(value);
    }
  }
  return values;
}

export interface NewSkillFlags {
  name: string | undefined;
  owner: string | undefined;
  purpose: string | undefined;
  whenToUse: string | undefined;
  input: string | undefined;
  decisionLogic: string | undefined;
  exceptions: string | undefined;
  output: string | undefined;
  examples: string[];
}

export function parseNewSkillFlags(argv: string[]): NewSkillFlags {
  return {
    name: readFlag(argv, '--name'),
    owner: readFlag(argv, '--owner'),
    purpose: readFlag(argv, '--purpose'),
    whenToUse: readFlag(argv, '--when-to-use'),
    input: readFlag(argv, '--input'),
    decisionLogic: readFlag(argv, '--decision-logic'),
    exceptions: readFlag(argv, '--exceptions'),
    output: readFlag(argv, '--output'),
    examples: readFlagList(argv, '--example'),
  };
}

const REQUIRED_FLAG_HINT =
  '--name, --owner, --purpose, --when-to-use, --input, --decision-logic, --exceptions, --output, and at least two --example flags';

export function answersFromFlags(flags: NewSkillFlags): {
  answers: SkillAnswers | null;
  missing: string[];
} {
  const missing: string[] = [];
  const requiredStringFields: Array<keyof SkillAnswers> = [
    'name',
    'owner',
    'purpose',
    'whenToUse',
    'input',
    'decisionLogic',
    'exceptions',
    'output',
  ];
  for (const field of requiredStringFields) {
    if (!flags[field]) missing.push(field);
  }
  if (flags.examples.length < 2) missing.push('examples');

  if (missing.length > 0) return { answers: null, missing };

  const [first, second, ...rest] = flags.examples as [string, string, ...string[]];
  return {
    answers: {
      name: flags.name!,
      owner: flags.owner!,
      purpose: flags.purpose!,
      whenToUse: flags.whenToUse!,
      input: flags.input!,
      decisionLogic: flags.decisionLogic!,
      exceptions: flags.exceptions!,
      output: flags.output!,
      examples: [first, second, ...rest],
    },
    missing: [],
  };
}

export async function writeSkillFiles(rootDir: string, answers: SkillAnswers): Promise<void> {
  const skillDir = join(rootDir, 'skills', answers.name);
  const evalsDir = join(rootDir, 'evals', answers.name);
  await mkdir(skillDir, { recursive: true });
  await mkdir(evalsDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), buildSkillMarkdown(answers));
  await writeFile(join(evalsDir, 'cases.yaml'), buildEvalsStub(answers.name));
}

export interface RunNewSkillOptions {
  rootDir: string;
  write: (text: string) => void;
  isInteractive: boolean;
  promptForAnswers?: (() => Promise<SkillAnswers | null>) | undefined;
}

export async function runNewSkill(argv: string[], options: RunNewSkillOptions): Promise<number> {
  if (!existsSync(join(options.rootDir, 'codsy.config.yaml'))) {
    options.write(NO_PROJECT_MESSAGE);
    return 1;
  }

  const flags = parseNewSkillFlags(argv);
  const { answers, missing } = answersFromFlags(flags);

  let finalAnswers = answers;
  if (finalAnswers === null) {
    if (!options.isInteractive || !options.promptForAnswers) {
      options.write(`Missing: ${missing.join(', ')}. Pass ${REQUIRED_FLAG_HINT}.\n`);
      return 1;
    }
    finalAnswers = await options.promptForAnswers();
    if (finalAnswers === null) {
      options.write('Cancelled. No files were created.\n');
      return 1;
    }
  }

  await writeSkillFiles(options.rootDir, finalAnswers);
  options.write(
    `Created skills/${finalAnswers.name}/SKILL.md and an evals stub.\nNext: fill in real eval cases, then run codsy check.\n`,
  );
  return 0;
}
