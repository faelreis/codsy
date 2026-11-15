import { resolve } from 'node:path';
import { copyTemplate, isTemplateName, type TemplateName } from './templates/copy-template';

export interface InitArgs {
  dir: string;
  template: TemplateName | null;
  invalidTemplate: string | null;
}

export function parseInitArgs(argv: string[]): InitArgs {
  let dir = '.';
  let template: TemplateName | null = null;
  let invalidTemplate: string | null = null;
  let dirSet = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--template') {
      const value = argv[i + 1];
      if (isTemplateName(value)) {
        template = value;
      } else {
        invalidTemplate = value ?? '';
      }
      i += 1;
    } else if (arg !== undefined && !dirSet) {
      dir = arg;
      dirSet = true;
    }
  }

  return { dir, template, invalidTemplate };
}

export interface RunInitOptions {
  templatesDir: string;
  write: (text: string) => void;
  isInteractive: boolean;
  promptForTemplate?: (() => Promise<TemplateName | null>) | undefined;
}

export async function runInit(argv: string[], options: RunInitOptions): Promise<number> {
  const { dir, template, invalidTemplate } = parseInitArgs(argv);

  if (invalidTemplate !== null) {
    options.write(
      `Unknown template "${invalidTemplate}". Choose one of: blank, sales, support, finance.\n`,
    );
    return 1;
  }

  let chosenTemplate = template;
  if (chosenTemplate === null) {
    if (!options.isInteractive || !options.promptForTemplate) {
      options.write(
        'No template was given. Pass --template <blank|sales|support|finance>, or run this command in an interactive terminal.\n',
      );
      return 1;
    }
    chosenTemplate = await options.promptForTemplate();
    if (chosenTemplate === null) {
      options.write('Cancelled. No files were created.\n');
      return 1;
    }
  }

  await copyTemplate(options.templatesDir, chosenTemplate, dir);
  options.write(formatInitSuccess(chosenTemplate, dir, process.cwd()));
  return 0;
}

export function formatInitSuccess(template: TemplateName, dir: string, cwd: string): string {
  if (resolve(cwd, dir) === resolve(cwd)) {
    return `Created a ${template} Codsy project in the current folder.\nNext: codsy check\n`;
  }
  return `Created a ${template} Codsy project in ${dir}.\nNext: cd ${dir} && codsy check\n`;
}
