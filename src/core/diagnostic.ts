export type Severity = 'error' | 'warn' | 'off';

export interface Diagnostic {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  message: string;
  fixHint?: string;
}
