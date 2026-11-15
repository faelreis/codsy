import type { Diagnostic } from './diagnostic';

export interface IgnoreDirective {
  ruleId: string;
  reason: string;
  line: number;
}

const IGNORE_LINE_PATTERN = /<!--\s*codsy-ignore\s+([A-Za-z]+\d+)\s*:\s*(.*?)\s*-->/;

export function parseIgnoreDirectives(raw: string): IgnoreDirective[] {
  const directives: IgnoreDirective[] = [];
  const lines = raw.split('\n');

  lines.forEach((lineText, index) => {
    const match = IGNORE_LINE_PATTERN.exec(lineText);
    if (!match) return;
    const ruleId = match[1];
    const reason = match[2];
    if (ruleId === undefined || reason === undefined) return;
    if (reason.trim().length === 0) return;
    directives.push({ ruleId, reason: reason.trim(), line: index + 1 });
  });

  return directives;
}

export function filterIgnoredDiagnostics(
  diagnostics: Diagnostic[],
  rawContentByFile: ReadonlyMap<string, string>,
): Diagnostic[] {
  const ignoredRuleIdsByFile = new Map<string, Set<string>>();

  return diagnostics.filter((diagnostic) => {
    const raw = rawContentByFile.get(diagnostic.file);
    if (raw === undefined) return true;

    let ignoredRuleIds = ignoredRuleIdsByFile.get(diagnostic.file);
    if (!ignoredRuleIds) {
      ignoredRuleIds = new Set(parseIgnoreDirectives(raw).map((directive) => directive.ruleId));
      ignoredRuleIdsByFile.set(diagnostic.file, ignoredRuleIds);
    }

    return !ignoredRuleIds.has(diagnostic.ruleId);
  });
}
