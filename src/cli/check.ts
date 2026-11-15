import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runCheck } from '../core/check-runner';
import type { Diagnostic } from '../core/diagnostic';
import { formatReport, type CheckFormat } from './check-format';

const NO_PROJECT_MESSAGE = 'No Codsy project found here. Run codsy init to start one.\n';

export interface CheckArgs {
  strict: boolean;
  format: CheckFormat;
  invalidFormat: string | null;
}

export function parseCheckArgs(argv: string[]): CheckArgs {
  let strict = false;
  let format: CheckFormat = 'pretty';
  let invalidFormat: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--strict') {
      strict = true;
    } else if (arg === '--format') {
      const value = argv[i + 1];
      if (value === 'pretty' || value === 'json' || value === 'sarif') {
        format = value;
      } else {
        invalidFormat = value ?? '';
      }
      i += 1;
    }
  }

  return { strict, format, invalidFormat };
}

export interface RunCheckCommandOptions {
  rootDir: string;
  write: (text: string) => void;
  isInteractive: boolean;
  renderRichReport?: ((diagnostics: Diagnostic[]) => Promise<void>) | undefined;
}

export async function runCheckCommand(
  argv: string[],
  options: RunCheckCommandOptions,
): Promise<number> {
  const { strict, format, invalidFormat } = parseCheckArgs(argv);

  if (invalidFormat !== null) {
    options.write(`Unknown format "${invalidFormat}". Choose one of: pretty, json, sarif.\n`);
    return 1;
  }

  if (!existsSync(join(options.rootDir, 'codsy.config.yaml'))) {
    options.write(NO_PROJECT_MESSAGE);
    return 1;
  }

  const result = await runCheck(options.rootDir, strict);

  const useRich = format === 'pretty' && options.isInteractive && options.renderRichReport;
  if (useRich && options.renderRichReport) {
    await options.renderRichReport(result.diagnostics);
  } else {
    options.write(formatReport(result.diagnostics, format));
  }

  return result.errorCount > 0 ? 1 : 0;
}
