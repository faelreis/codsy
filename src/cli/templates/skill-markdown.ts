export interface SkillAnswers {
  name: string;
  owner: string;
  purpose: string;
  whenToUse: string;
  input: string;
  decisionLogic: string;
  exceptions: string;
  output: string;
  examples: [string, string, ...string[]];
}

function buildDescription(answers: SkillAnswers): string {
  return `${answers.purpose} Used when ${lowercaseFirst(answers.whenToUse)}`;
}

function lowercaseFirst(text: string): string {
  return text.length === 0 ? text : text[0]!.toLowerCase() + text.slice(1);
}

export function buildSkillMarkdown(answers: SkillAnswers): string {
  const today = new Date().toISOString().slice(0, 10);
  const examplesList = answers.examples
    .map((example, index) => `${index + 1}. ${example}`)
    .join('\n');

  return `---
name: ${answers.name}
description: ${buildDescription(answers)}
metadata:
  owner: ${answers.owner}
  last_reviewed: ${today}
  review_every_days: 90
---

## Purpose

${answers.purpose}

## When to use

${answers.whenToUse}

## Input

${answers.input}

## Decision logic

${answers.decisionLogic}

## Exceptions

${answers.exceptions}

## Output

${answers.output}

## Examples

${examplesList}
`;
}

export function buildEvalsStub(skillName: string): string {
  return `skill: ${skillName}\ncases: []\n`;
}
