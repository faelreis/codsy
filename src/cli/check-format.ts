import type { Diagnostic } from '../core/diagnostic';

export type CheckFormat = 'pretty' | 'json' | 'sarif';

export interface CheckSummary {
  errorCount: number;
  warnCount: number;
}

export function summarize(diagnostics: Diagnostic[]): CheckSummary {
  return {
    errorCount: diagnostics.filter((d) => d.severity === 'error').length,
    warnCount: diagnostics.filter((d) => d.severity === 'warn').length,
  };
}

export function summaryLine(summary: CheckSummary): string {
  const fix = pluralize(summary.errorCount, 'thing to fix', 'things to fix');
  const suggest = pluralize(summary.warnCount, 'suggestion', 'suggestions');
  if (summary.errorCount === 0 && summary.warnCount === 0) {
    return 'Everything checks out.';
  }
  return `${summary.errorCount} ${fix}, ${summary.warnCount} ${suggest}.`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function nextStepLine(summary: CheckSummary): string {
  if (summary.errorCount > 0) {
    return 'Fix the errors above, then run codsy check again.';
  }
  if (summary.warnCount > 0) {
    return 'No errors. Review the suggestions above when you have time.';
  }
  return 'No further action needed.';
}

function groupByFile(diagnostics: Diagnostic[]): Map<string, Diagnostic[]> {
  const groups = new Map<string, Diagnostic[]>();
  for (const diagnostic of diagnostics) {
    const existing = groups.get(diagnostic.file);
    if (existing) {
      existing.push(diagnostic);
    } else {
      groups.set(diagnostic.file, [diagnostic]);
    }
  }
  return groups;
}

export function formatPlainText(diagnostics: Diagnostic[]): string {
  const summary = summarize(diagnostics);
  if (diagnostics.length === 0) {
    return `${summaryLine(summary)}\n${nextStepLine(summary)}\n`;
  }

  const lines: string[] = [];
  const groups = groupByFile(diagnostics);
  for (const [file, fileDiagnostics] of groups) {
    lines.push(file);
    for (const diagnostic of fileDiagnostics) {
      lines.push(
        `  ${diagnostic.severity.toUpperCase()} ${diagnostic.ruleId} line ${diagnostic.line}: ${diagnostic.message}`,
      );
      if (diagnostic.fixHint) {
        lines.push(`    Fix: ${diagnostic.fixHint}`);
      }
    }
  }
  lines.push('');
  lines.push(summaryLine(summary));
  lines.push(nextStepLine(summary));
  return `${lines.join('\n')}\n`;
}

export function formatJson(diagnostics: Diagnostic[]): string {
  const summary = summarize(diagnostics);
  return `${JSON.stringify({ diagnostics, summary }, null, 2)}\n`;
}

const SARIF_SEVERITY: Record<Diagnostic['severity'], string> = {
  error: 'error',
  warn: 'warning',
  off: 'note',
};

export function formatSarif(diagnostics: Diagnostic[]): string {
  const sarif = {
    $schema:
      'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'codsy',
            informationUri: 'https://github.com/faelreis/codsy',
            rules: [...new Set(diagnostics.map((d) => d.ruleId))].map((ruleId) => ({ id: ruleId })),
          },
        },
        results: diagnostics.map((diagnostic) => ({
          ruleId: diagnostic.ruleId,
          level: SARIF_SEVERITY[diagnostic.severity],
          message: { text: diagnostic.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: diagnostic.file },
                region: { startLine: diagnostic.line },
              },
            },
          ],
        })),
      },
    ],
  };
  return `${JSON.stringify(sarif, null, 2)}\n`;
}

export function formatReport(diagnostics: Diagnostic[], format: CheckFormat): string {
  if (format === 'json') return formatJson(diagnostics);
  if (format === 'sarif') return formatSarif(diagnostics);
  return formatPlainText(diagnostics);
}
