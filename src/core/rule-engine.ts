import type { Config } from './config';
import type { Diagnostic } from './diagnostic';
import { filterIgnoredDiagnostics } from './ignore';
import type { Project } from './project-loader';

export type Rule = (project: Project, config: Config) => Diagnostic[];

export function runRules(rules: Rule[], project: Project, config: Config): Diagnostic[] {
  const diagnostics = rules.flatMap((rule) => rule(project, config));
  const rawContentByFile = new Map<string, string>();

  for (const skill of project.skills) {
    rawContentByFile.set(skill.relativePath, skill.raw);
  }
  for (const contextFile of project.contextFiles) {
    rawContentByFile.set(contextFile.relativePath, contextFile.raw);
  }

  return filterIgnoredDiagnostics(diagnostics, rawContentByFile);
}
