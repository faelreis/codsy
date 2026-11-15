import type { Diagnostic } from '../core/diagnostic';
import { nextStepLine, summarize, summaryLine } from '../cli/check-format';
import type { ColorLevel } from './capabilities';
import { hexToAnsiForeground } from './mascot/grid';
import { THEME } from './theme';

const ANSI_RESET = '\x1b[0m';
const ANSI_BOLD = '\x1b[1m';

function colorize(text: string, hex: string, colorLevel: ColorLevel): string {
  const code = hexToAnsiForeground(hex, colorLevel);
  return code ? `${code}${text}${ANSI_RESET}` : text;
}

function bold(text: string, colorLevel: ColorLevel): string {
  return colorLevel === 'none' ? text : `${ANSI_BOLD}${text}${ANSI_RESET}`;
}

function severityColor(severity: Diagnostic['severity']): string {
  if (severity === 'error') return THEME.error;
  if (severity === 'warn') return THEME.warning;
  return THEME.dim;
}

function groupByFile(diagnostics: Diagnostic[]): Map<string, Diagnostic[]> {
  const groups = new Map<string, Diagnostic[]>();
  for (const diagnostic of diagnostics) {
    const existing = groups.get(diagnostic.file);
    if (existing) existing.push(diagnostic);
    else groups.set(diagnostic.file, [diagnostic]);
  }
  return groups;
}

export function formatRichText(diagnostics: Diagnostic[], colorLevel: ColorLevel): string {
  const summary = summarize(diagnostics);
  const summaryColor =
    summary.errorCount > 0 ? THEME.error : summary.warnCount > 0 ? THEME.warning : THEME.success;

  if (diagnostics.length === 0) {
    return `${colorize(summaryLine(summary), summaryColor, colorLevel)}\n${nextStepLine(summary)}\n`;
  }

  const lines: string[] = [];
  for (const [file, fileDiagnostics] of groupByFile(diagnostics)) {
    lines.push(bold(file, colorLevel));
    for (const diagnostic of fileDiagnostics) {
      const label = colorize(
        `${diagnostic.severity.toUpperCase()} ${diagnostic.ruleId}`,
        severityColor(diagnostic.severity),
        colorLevel,
      );
      lines.push(`  ${label} line ${diagnostic.line}: ${diagnostic.message}`);
      if (diagnostic.fixHint) {
        lines.push(`    ${colorize('Fix:', THEME.dim, colorLevel)} ${diagnostic.fixHint}`);
      }
    }
    lines.push('');
  }
  lines.push(colorize(summaryLine(summary), summaryColor, colorLevel));
  lines.push(nextStepLine(summary));
  return `${lines.join('\n')}\n`;
}
