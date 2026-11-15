#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '../../package.json' with { type: 'json' };
import { findPackageRoot } from '../core/package-root';
import { runInit } from './init';
import { runCheckCommand } from './check';
import { runExplain } from './explain';
import { runNewSkill } from './new-skill';
import { runNewSchema } from './new-schema';
import { runHomeCommand } from './home';
import { runEvalCommand } from './eval';
import { formatFriendlyError } from './friendly-error';
import { HELP_TEXT, isHelpRequest } from './help';

const HELP_MESSAGE = 'Codsy is set up. Run codsy --version to see the installed version.';
const KNOWN_COMMANDS = ['init', 'check', 'new', 'explain', 'eval'];

export function run(argv: string[]): string {
  if (argv.includes('--version') || argv.includes('-v')) {
    return pkg.version;
  }
  return HELP_MESSAGE;
}

function isInteractive(argv: string[]): boolean {
  return Boolean(process.stdout.isTTY) && !argv.includes('--plain');
}

function write(text: string): void {
  process.stdout.write(text);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  try {
    await dispatch(argv);
  } catch (error) {
    process.stderr.write(formatFriendlyError(error, `codsy ${argv.join(' ')}`.trim()));
    process.exitCode = 1;
  }
}

async function dispatch(argv: string[]): Promise<void> {
  const rootDir = process.cwd();

  if (isHelpRequest(argv)) {
    write(HELP_TEXT);
    return;
  }

  if (argv.length === 0) {
    const interactive = isInteractive(argv);
    process.exitCode = await runHomeCommand({
      rootDir,
      write,
      isInteractive: interactive,
      renderRichHome: interactive
        ? async (status) => {
            const { renderHomeScreen } = await import('../ui/home-screen');
            return renderHomeScreen(status);
          }
        : undefined,
    });
    return;
  }

  if (argv[0] === 'init') {
    const templatesDir = join(findPackageRoot(import.meta.url), 'templates');
    const interactive = isInteractive(argv);
    process.exitCode = await runInit(argv.slice(1), {
      templatesDir,
      write,
      isInteractive: interactive,
      promptForTemplate: interactive
        ? async () => {
            const { promptForTemplate } = await import('../ui/init-wizard');
            return promptForTemplate();
          }
        : undefined,
    });
    return;
  }

  if (argv[0] === 'check') {
    const interactive = isInteractive(argv);
    process.exitCode = await runCheckCommand(argv.slice(1), {
      rootDir,
      write,
      isInteractive: interactive,
      renderRichReport: interactive
        ? async (diagnostics) => {
            const { renderCheckScreen } = await import('../ui/check-screen');
            renderCheckScreen(diagnostics);
          }
        : undefined,
    });
    return;
  }

  if (argv[0] === 'explain') {
    process.exitCode = runExplain(argv.slice(1), write);
    return;
  }

  if (argv[0] === 'eval') {
    process.exitCode = await runEvalCommand(argv.slice(1), { rootDir, write });
    return;
  }

  if (argv[0] === 'new') {
    const interactive = isInteractive(argv);
    const subcommand = argv[1];
    const rest = argv.slice(2);

    if (subcommand === 'skill') {
      process.exitCode = await runNewSkill(rest, {
        rootDir,
        write,
        isInteractive: interactive,
        promptForAnswers: interactive
          ? async () => {
              const { promptForSkillAnswers } = await import('../ui/new-skill-wizard');
              return promptForSkillAnswers();
            }
          : undefined,
      });
    } else if (subcommand === 'schema') {
      process.exitCode = await runNewSchema(rest, {
        rootDir,
        write,
        isInteractive: interactive,
        promptForAnswers: interactive
          ? async () => {
              const { promptForSchemaAnswers } = await import('../ui/new-schema-wizard');
              return promptForSchemaAnswers();
            }
          : undefined,
      });
    } else {
      write('Usage: codsy new <skill|schema>\n');
      process.exitCode = 1;
    }
    return;
  }

  if (
    !argv.includes('--version') &&
    !argv.includes('-v') &&
    !KNOWN_COMMANDS.includes(argv[0] ?? '')
  ) {
    write(`Unknown command "${argv[0]}". Run codsy --help to see what you can do.\n`);
    process.exitCode = 1;
    return;
  }

  write(`${run(argv)}\n`);
}

export function isDirectInvocation(
  argv1: string | undefined,
  moduleUrl: string,
  resolveRealPath: (path: string) => string = realpathSync,
): boolean {
  return argv1 !== undefined && resolveRealPath(argv1) === fileURLToPath(moduleUrl);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  await main();
}
