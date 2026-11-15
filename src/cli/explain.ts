import { RULE_DOCS } from '../core/rule-docs';

export function runExplain(argv: string[], write: (text: string) => void): number {
  const ruleId = argv[0];
  if (!ruleId) {
    write('Usage: codsy explain <RULE_ID>\n');
    return 1;
  }

  const doc = RULE_DOCS[ruleId.toUpperCase()];
  if (!doc) {
    write(
      `Unknown rule "${ruleId}". Run codsy check to see which rule ids apply to your project.\n`,
    );
    return 1;
  }

  write(
    `${ruleId.toUpperCase()} — ${doc.summary}\n\nWhy this matters: ${doc.why}\n\nHow to fix: ${doc.fix}\n`,
  );
  return 0;
}
