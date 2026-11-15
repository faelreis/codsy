import { resolveSeverity } from '../core/config';
import type { Diagnostic, Severity } from '../core/diagnostic';
import type { Rule } from '../core/rule-engine';
import type { SkillSection } from '../core/skill-parser';
import { findSection, stripComments } from './section-utils';

const MIN_DESCRIPTION_LENGTH = 20;

function isEffectivelyEmpty(body: string): boolean {
  return stripComments(body).trim().length === 0;
}

function countWorkedExamples(section: SkillSection | null): number {
  if (!section) return 0;
  const lines = stripComments(section.body).split('\n');
  const listItemCount = lines.filter((line) => /^\s*(\d+[.)]|[-*])\s+\S/.test(line)).length;
  return listItemCount + section.children.length;
}

function isReviewOverdue(lastReviewed: string, reviewEveryDays: number): boolean {
  const lastDate = new Date(lastReviewed);
  if (Number.isNaN(lastDate.getTime())) return false;
  const dueAt = lastDate.getTime() + reviewEveryDays * 24 * 60 * 60 * 1000;
  return Date.now() > dueAt;
}

export const codsy001InvalidFrontmatter: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY001', 'error');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    if (skill.frontmatterError) {
      diagnostics.push({
        ruleId: 'CODSY001',
        severity,
        file: skill.relativePath,
        line: 1,
        message: skill.frontmatterError,
        fixHint: 'Fix the YAML frontmatter at the top of SKILL.md.',
      });
      continue;
    }

    const name = skill.frontmatter.name;
    if (typeof name !== 'string' || name.trim().length === 0) {
      diagnostics.push({
        ruleId: 'CODSY001',
        severity,
        file: skill.relativePath,
        line: 1,
        message: `SKILL.md frontmatter for '${skill.dirName}' is missing a "name" field.`,
        fixHint: `Add name: ${skill.dirName} to the frontmatter.`,
      });
      continue;
    }

    if (name !== skill.dirName) {
      diagnostics.push({
        ruleId: 'CODSY001',
        severity,
        file: skill.relativePath,
        line: 1,
        message: `Frontmatter name '${name}' does not match the folder name '${skill.dirName}'.`,
        fixHint: `Rename the folder to '${name}', or change name to '${skill.dirName}' in the frontmatter.`,
      });
    }
  }
  return diagnostics;
};

export const codsy002WeakDescription: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY002', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    const description = skill.frontmatter.description;
    const trimmed = typeof description === 'string' ? description.trim() : '';

    let message: string | null = null;
    if (trimmed.length === 0) {
      message = `Skill '${skill.dirName}' has no description.`;
    } else if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
      message = `Skill '${skill.dirName}' description is too short to explain what it does.`;
    } else if (!/\bwhen\b/i.test(trimmed)) {
      message = `Skill '${skill.dirName}' description does not say when to use it.`;
    }

    if (message) {
      diagnostics.push({
        ruleId: 'CODSY002',
        severity,
        file: skill.relativePath,
        line: 1,
        message,
        fixHint:
          'Describe what the skill does and when an agent should use it, in one or two sentences.',
      });
    }
  }
  return diagnostics;
};

export const codsy010MissingRequiredSections: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY010', 'error');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    for (const requiredHeading of config.requiredSections) {
      if (!findSection(skill.sections, requiredHeading)) {
        diagnostics.push({
          ruleId: 'CODSY010',
          severity,
          file: skill.relativePath,
          line: skill.bodyStartLine,
          message: `Skill '${skill.dirName}' is missing the required '${requiredHeading}' section.`,
          fixHint: `Add a '## ${requiredHeading}' section to SKILL.md.`,
        });
      }
    }
  }
  return diagnostics;
};

export const codsy011TooFewExamples: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY011', 'error');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    const examplesSection = findSection(skill.sections, 'Examples');
    const count = countWorkedExamples(examplesSection);
    if (count < config.minWorkedExamples) {
      diagnostics.push({
        ruleId: 'CODSY011',
        severity,
        file: skill.relativePath,
        line: examplesSection?.line ?? skill.bodyStartLine,
        message: `Skill '${skill.dirName}' has ${count} worked example(s); it needs at least ${config.minWorkedExamples}.`,
        fixHint: 'Add numbered real-world examples showing the input and the resulting decision.',
      });
    }
  }
  return diagnostics;
};

export const codsy012EmptyExceptions: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY012', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    const exceptionsSection = findSection(skill.sections, 'Exceptions');
    if (exceptionsSection && isEffectivelyEmpty(exceptionsSection.body)) {
      diagnostics.push({
        ruleId: 'CODSY012',
        severity,
        file: skill.relativePath,
        line: exceptionsSection.line,
        message: `Skill '${skill.dirName}' has an empty Exceptions section.`,
        fixHint:
          "List the cases where the normal decision logic does not apply, or write 'None known.' if there truly are none.",
      });
    }
  }
  return diagnostics;
};

export const codsy050OwnerOrReview: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY050', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const skill of project.skills) {
    const metadata = skill.frontmatter.metadata;
    const owner = metadata?.owner;
    if (typeof owner !== 'string' || owner.trim().length === 0) {
      diagnostics.push({
        ruleId: 'CODSY050',
        severity,
        file: skill.relativePath,
        line: 1,
        message: `Skill '${skill.dirName}' has no owner.`,
        fixHint: 'Add metadata.owner to the frontmatter.',
      });
    }

    const lastReviewed = metadata?.last_reviewed;
    const reviewEveryDays = metadata?.review_every_days;
    if (
      typeof lastReviewed === 'string' &&
      typeof reviewEveryDays === 'number' &&
      isReviewOverdue(lastReviewed, reviewEveryDays)
    ) {
      diagnostics.push({
        ruleId: 'CODSY050',
        severity,
        file: skill.relativePath,
        line: 1,
        message: `Skill '${skill.dirName}' was last reviewed on ${lastReviewed} and is overdue for its ${reviewEveryDays}-day review.`,
        fixHint: 'Review the skill and update metadata.last_reviewed.',
      });
    }
  }
  return diagnostics;
};

export const codsy070InsufficientEvals: Rule = (project, config) => {
  const defaultSeverity: Severity = config.strict ? 'error' : 'warn';
  const severity = config.severities.CODSY070 ?? defaultSeverity;
  if (severity === 'off') return [];

  const suitesBySkill = new Map(project.evalSuites.map((suite) => [suite.skill, suite]));
  const diagnostics: Diagnostic[] = [];

  for (const skill of project.skills) {
    const suite = suitesBySkill.get(skill.dirName);
    if (!suite) {
      diagnostics.push({
        ruleId: 'CODSY070',
        severity,
        file: skill.relativePath,
        line: 1,
        message: `Skill '${skill.dirName}' has no evals.`,
        fixHint: `Add evals/${skill.dirName}/cases.yaml with at least ${config.minEvalCases} example cases.`,
      });
      continue;
    }
    if (suite.cases.length < config.minEvalCases) {
      diagnostics.push({
        ruleId: 'CODSY070',
        severity,
        file: suite.relativePath,
        line: 1,
        message: `Skill '${skill.dirName}' has ${suite.cases.length} eval case(s); it needs at least ${config.minEvalCases}.`,
        fixHint: `Add more cases to evals/${skill.dirName}/cases.yaml.`,
      });
    }
  }
  return diagnostics;
};

export const skillStructureRules: Rule[] = [
  codsy001InvalidFrontmatter,
  codsy002WeakDescription,
  codsy010MissingRequiredSections,
  codsy011TooFewExamples,
  codsy012EmptyExceptions,
  codsy050OwnerOrReview,
  codsy070InsufficientEvals,
];
