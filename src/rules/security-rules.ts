import { extname } from 'node:path';
import { resolveSeverity } from '../core/config';
import type { Diagnostic } from '../core/diagnostic';
import type { Project } from '../core/project-loader';
import type { Rule } from '../core/rule-engine';
import { maskMatch } from './masking';
import {
  DEFAULT_PERSONAL_DATA_PATTERNS,
  EMAIL_PATTERN_NAME,
  isExemptEmailMatch,
} from './personal-data-patterns';
import { PROMPT_INJECTION_PATTERNS, SECRET_PATTERNS, type NamedPattern } from './secret-patterns';

interface ScannableFile {
  file: string;
  raw: string;
}

function allScannableFiles(project: Project): ScannableFile[] {
  return [
    ...project.skills.map((skill) => ({ file: skill.relativePath, raw: skill.raw })),
    ...project.contextFiles.map((file) => ({ file: file.relativePath, raw: file.raw })),
    ...project.schemas.map((schema) => ({ file: schema.relativePath, raw: schema.raw })),
    ...project.evalSuites.map((suite) => ({ file: suite.relativePath, raw: suite.raw })),
  ];
}

function skillAndContextFiles(project: Project): ScannableFile[] {
  return [
    ...project.skills.map((skill) => ({ file: skill.relativePath, raw: skill.raw })),
    ...project.contextFiles.map((file) => ({ file: file.relativePath, raw: file.raw })),
  ];
}

function lineNumberAt(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function findAllMatches(pattern: RegExp, text: string): RegExpExecArray[] {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    matches.push(match);
    if (match[0].length === 0) re.lastIndex += 1;
  }
  return matches;
}

function scanFor(
  files: ScannableFile[],
  patterns: readonly NamedPattern[],
  build: (file: string, line: number, name: string, matchText: string) => Diagnostic,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const { file, raw } of files) {
    for (const { name, pattern } of patterns) {
      for (const match of findAllMatches(pattern, raw)) {
        diagnostics.push(build(file, lineNumberAt(raw, match.index), name, match[0]));
      }
    }
  }
  return diagnostics;
}

export const codsy060Secrets: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY060', 'error');
  if (severity === 'off') return [];

  return scanFor(allScannableFiles(project), SECRET_PATTERNS, (file, line, name, matchText) => ({
    ruleId: 'CODSY060',
    severity,
    file,
    line,
    message: `Possible ${name} found: ${maskMatch(matchText)}.`,
    fixHint: 'Remove the secret from version control and rotate it immediately.',
  }));
};

export const codsy061PromptInjection: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY061', 'error');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const { file, raw } of skillAndContextFiles(project)) {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      for (const match of findAllMatches(pattern, raw)) {
        diagnostics.push({
          ruleId: 'CODSY061',
          severity,
          file,
          line: lineNumberAt(raw, match.index),
          message: `Possible prompt-injection text found: "${match[0]}".`,
          fixHint:
            'Remove or rephrase this text; it reads as an instruction aimed at an AI agent rather than content about the business.',
        });
      }
    }
  }
  return diagnostics;
};

const EXECUTABLE_SCRIPT_EXTENSIONS: ReadonlySet<string> = new Set([
  '.sh',
  '.bash',
  '.zsh',
  '.py',
  '.rb',
  '.pl',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.ps1',
  '.psm1',
  '.bat',
  '.cmd',
  '.exe',
]);

export const codsy062DisallowedScripts: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY062', 'error');
  if (severity === 'off') return [];

  const allowed = new Set(config.allowedScripts);
  const diagnostics: Diagnostic[] = [];

  for (const skill of project.skills) {
    for (const relativeFile of skill.files) {
      if (!EXECUTABLE_SCRIPT_EXTENSIONS.has(extname(relativeFile).toLowerCase())) continue;

      const allowlistKey = `${skill.dirName}/${relativeFile}`;
      if (allowed.has(allowlistKey)) continue;

      diagnostics.push({
        ruleId: 'CODSY062',
        severity,
        file: `${skill.relativePath.replace(/SKILL\.md$/, '')}${relativeFile}`,
        line: 1,
        message: `Skill '${skill.dirName}' contains an executable script '${relativeFile}' that is not on the allowlist.`,
        fixHint: `Add '${allowlistKey}' to allowedScripts in codsy.config.yaml if this script is reviewed and trusted, or remove it.`,
      });
    }
  }
  return diagnostics;
};

export const codsy080PersonalData: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY080', 'error');
  if (severity === 'off') return [];

  const customPatterns: NamedPattern[] = config.personalDataPatterns.map((source) => ({
    name: 'custom personal data pattern',
    pattern: new RegExp(source, 'g'),
  }));
  const patterns = [...DEFAULT_PERSONAL_DATA_PATTERNS, ...customPatterns];

  const diagnostics: Diagnostic[] = [];
  for (const { file, raw } of allScannableFiles(project)) {
    for (const { name, pattern } of patterns) {
      for (const match of findAllMatches(pattern, raw)) {
        if (name === EMAIL_PATTERN_NAME && isExemptEmailMatch(match[0])) continue;

        diagnostics.push({
          ruleId: 'CODSY080',
          severity,
          file,
          line: lineNumberAt(raw, match.index),
          message: `Possible ${name} found: ${maskMatch(match[0])}.`,
          fixHint: 'Replace real personal data with fictional sample data, or redact it.',
        });
      }
    }
  }
  return diagnostics;
};

export const securityRules: Rule[] = [
  codsy060Secrets,
  codsy061PromptInjection,
  codsy062DisallowedScripts,
  codsy080PersonalData,
];
