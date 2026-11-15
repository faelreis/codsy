import { ALL_RULES } from './all-rules';
import { loadConfig, type Config } from './config';
import type { Diagnostic } from './diagnostic';
import { loadProject, type Project } from './project-loader';
import { runRules } from './rule-engine';

export interface CheckResult {
  config: Config;
  project: Project;
  diagnostics: Diagnostic[];
  errorCount: number;
  warnCount: number;
}

export async function runCheck(rootDir: string, strict: boolean): Promise<CheckResult> {
  const baseConfig = await loadConfig(rootDir);
  const config = strict ? { ...baseConfig, strict: true } : baseConfig;
  const project = await loadProject(rootDir);
  const diagnostics = runRules(ALL_RULES, project, config);

  return {
    config,
    project,
    diagnostics,
    errorCount: diagnostics.filter((d) => d.severity === 'error').length,
    warnCount: diagnostics.filter((d) => d.severity === 'warn').length,
  };
}
