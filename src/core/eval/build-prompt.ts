import type { ContextFile, SchemaFile, Skill } from '../project-loader';

export function buildPrompt(
  skill: Skill,
  schemas: SchemaFile[],
  contextFiles: ContextFile[],
  input: unknown,
): string {
  const parts: string[] = [];

  parts.push('You are deciding a real business decision using the rules below.');
  parts.push('Respond with a single JSON object and nothing else: no prose, no markdown fences.');
  parts.push('');

  for (const contextFile of contextFiles) {
    parts.push(`## Context: ${contextFile.name}`, '', contextFile.raw.trim(), '');
  }

  for (const schema of schemas) {
    parts.push(`## Schema: ${schema.name}`, '', schema.raw.trim(), '');
  }

  parts.push('## Skill', '', skill.raw.trim(), '');
  parts.push('## Input', '', JSON.stringify(input, null, 2), '');
  parts.push('## Your answer (JSON object only)');

  return parts.join('\n');
}
