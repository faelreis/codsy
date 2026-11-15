import { TEMPLATE_NAMES } from './templates/copy-template';

const HELP_FLAGS = ['--help', '-h'];

export function isHelpRequest(argv: string[]): boolean {
  return argv[0] === 'help' || argv.some((arg) => HELP_FLAGS.includes(arg));
}

export const HELP_TEXT = `Codsy helps you write operational knowledge as versioned files people and AI agents can both read.

Usage: codsy <command> [options]

Commands:
  codsy                       Show the home screen
  codsy init [folder]         Start a new project
      --template <name>       Use a template: ${TEMPLATE_NAMES.join(', ')}
  codsy new skill             Add a skill (asks questions, or pass --name, --owner, --purpose, ...)
  codsy new schema            Add a schema (asks questions, or pass --name, --description, --field)
  codsy check                 Check your project for problems
      --strict                Treat skills without enough evals as errors
      --format <format>       Output as pretty, json, or sarif
  codsy explain <RULE_ID>     Explain a rule, for example codsy explain CODSY010
  codsy eval [skill]          Test skills against their examples with an AI model
      --dry-run               Show what would run without calling the model
      --threshold <number>    Minimum passing score

Options:
  --plain                     Plain text, no colors or animation
  -v, --version               Show the installed version
  -h, --help                  Show this help
`;
