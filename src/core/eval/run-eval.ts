import type { ContextFile, EvalCase, SchemaFile, Skill } from '../project-loader';
import { buildPrompt } from './build-prompt';
import { parseAnswer } from './parse-answer';
import type { EvalProvider } from './provider';

export interface CaseResult {
  id: string;
  prompt: string;
  passed: boolean;
  expected: unknown;
  actual: Record<string, unknown> | null;
  rawResponse: string | null;
  error: string | null;
}

export interface SkillEvalResult {
  skillName: string;
  caseResults: CaseResult[];
  accuracy: number;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const keys = Object.keys(aRecord);
  return (
    keys.length === Object.keys(bRecord).length &&
    keys.every((key) => deepEqual(aRecord[key], bRecord[key]))
  );
}

function matchesExpected(expected: unknown, actual: Record<string, unknown>): boolean {
  if (expected === null || typeof expected !== 'object' || Array.isArray(expected)) {
    return false;
  }
  return Object.entries(expected as Record<string, unknown>).every(([key, value]) =>
    deepEqual(value, actual[key]),
  );
}

export async function evalCase(
  skill: Skill,
  schemas: SchemaFile[],
  contextFiles: ContextFile[],
  evalCaseData: EvalCase,
  provider: EvalProvider,
): Promise<CaseResult> {
  const prompt = buildPrompt(skill, schemas, contextFiles, evalCaseData.input);

  try {
    const rawResponse = await provider.send(prompt);
    const actual = parseAnswer(rawResponse);
    const passed = actual !== null && matchesExpected(evalCaseData.expected, actual);
    return {
      id: evalCaseData.id,
      prompt,
      passed,
      expected: evalCaseData.expected,
      actual,
      rawResponse,
      error: null,
    };
  } catch (error) {
    return {
      id: evalCaseData.id,
      prompt,
      passed: false,
      expected: evalCaseData.expected,
      actual: null,
      rawResponse: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function evalSkill(
  skill: Skill,
  schemas: SchemaFile[],
  contextFiles: ContextFile[],
  cases: EvalCase[],
  provider: EvalProvider,
): Promise<SkillEvalResult> {
  const caseResults = await Promise.all(
    cases.map((evalCaseData) => evalCase(skill, schemas, contextFiles, evalCaseData, provider)),
  );
  const passedCount = caseResults.filter((result) => result.passed).length;
  const accuracy = cases.length === 0 ? 1 : passedCount / cases.length;

  return { skillName: skill.dirName, caseResults, accuracy };
}
