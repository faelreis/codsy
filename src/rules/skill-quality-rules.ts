import { resolveSeverity } from '../core/config';
import type { Diagnostic } from '../core/diagnostic';
import type { Rule } from '../core/rule-engine';
import type { Skill } from '../core/project-loader';
import { collectSectionText, findSection } from './section-utils';
import { DEFAULT_VAGUE_TERMS } from './vague-terms';

function bodyLineCount(skill: Skill): number {
  return skill.raw.split('\n').length - skill.bodyStartLine + 1;
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return new Set(words);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersectionSize = 0;
  for (const word of a) {
    if (b.has(word)) intersectionSize += 1;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function hasConcreteReference(sentence: string): boolean {
  return /\d/.test(sentence) || /`[^`]+`/.test(sentence);
}

function findVagueTerm(sentence: string, vagueTerms: readonly string[]): string | null {
  const lower = sentence.toLowerCase();
  for (const term of vagueTerms) {
    if (lower.includes(term.toLowerCase())) return term;
  }
  return null;
}

export const codsy020OversizedBody: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY020', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    const lineCount = bodyLineCount(skill);
    if (lineCount > config.maxSkillBodyLines) {
      diagnostics.push({
        ruleId: 'CODSY020',
        severity,
        file: skill.relativePath,
        line: 1,
        message: `Skill '${skill.dirName}' body is ${lineCount} lines, over the limit of ${config.maxSkillBodyLines}.`,
        fixHint:
          'Move background detail into a references/ file and keep SKILL.md focused on the decision.',
      });
    }
  }
  return diagnostics;
};

export const codsy021SimilarDescriptions: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY021', 'warn');
  if (severity === 'off') return [];

  const entries = project.skills
    .map((skill) => ({
      skill,
      description:
        typeof skill.frontmatter.description === 'string'
          ? skill.frontmatter.description.trim()
          : '',
    }))
    .filter((entry) => entry.description.length > 0);

  const diagnostics: Diagnostic[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i];
      const b = entries[j];
      if (!a || !b) continue;

      const similarity = jaccardSimilarity(tokenize(a.description), tokenize(b.description));
      if (similarity < config.descriptionSimilarityThreshold) continue;

      const overlapPercent = Math.round(similarity * 100);
      const message = `Skill '${a.skill.dirName}' and skill '${b.skill.dirName}' have highly similar descriptions (${overlapPercent}% word overlap).`;
      diagnostics.push({
        ruleId: 'CODSY021',
        severity,
        file: a.skill.relativePath,
        line: 1,
        message,
        fixHint: `Make the description specific about what makes '${a.skill.dirName}' different from '${b.skill.dirName}'.`,
      });
      diagnostics.push({
        ruleId: 'CODSY021',
        severity,
        file: b.skill.relativePath,
        line: 1,
        message,
        fixHint: `Make the description specific about what makes '${b.skill.dirName}' different from '${a.skill.dirName}'.`,
      });
    }
  }
  return diagnostics;
};

export const codsy030VagueStatement: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY030', 'warn');
  if (severity === 'off') return [];

  const vagueTerms = [...DEFAULT_VAGUE_TERMS, ...config.vagueTermsExtensions];
  const diagnostics: Diagnostic[] = [];

  for (const skill of project.skills) {
    for (const sectionName of ['Decision logic', 'Exceptions']) {
      const section = findSection(skill.sections, sectionName);
      if (!section) continue;

      for (const sentence of splitSentences(collectSectionText(section))) {
        if (hasConcreteReference(sentence)) continue;
        const term = findVagueTerm(sentence, vagueTerms);
        if (!term) continue;

        diagnostics.push({
          ruleId: 'CODSY030',
          severity,
          file: skill.relativePath,
          line: section.line,
          message: `Skill '${skill.dirName}' uses the vague phrase "${term}" in ${sectionName} without a number, unit, or concrete reference: "${sentence}"`,
          fixHint:
            'Replace it with a concrete rule, e.g. "at-risk accounts go to senior support within 2 hours".',
        });
      }
    }
  }
  return diagnostics;
};

export const skillQualityRules: Rule[] = [
  codsy020OversizedBody,
  codsy021SimilarDescriptions,
  codsy030VagueStatement,
];
