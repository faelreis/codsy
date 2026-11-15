import { join } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import type { Severity } from './diagnostic';
import { readFileIfExists } from './fs-helpers';
import { isRecord } from './type-guards';

export type EvalProviderName = 'command' | 'anthropic' | 'openai-compatible';

export interface EvalConfig {
  provider: EvalProviderName;
  command: string | null;
  model: string | null;
  baseUrl: string;
  threshold: number;
}

export interface Config {
  severities: Record<string, Severity>;
  requiredSections: string[];
  maxSkillBodyLines: number;
  minWorkedExamples: number;
  minEvalCases: number;
  maxRequiredSchemaFields: number;
  vagueTermsExtensions: string[];
  strict: boolean;
  descriptionSimilarityThreshold: number;
  allowedScripts: string[];
  personalDataPatterns: string[];
  eval: EvalConfig;
}

export const DEFAULT_CONFIG: Config = {
  severities: {},
  requiredSections: [
    'Purpose',
    'When to use',
    'Input',
    'Decision logic',
    'Exceptions',
    'Output',
    'Examples',
  ],
  maxSkillBodyLines: 300,
  minWorkedExamples: 2,
  minEvalCases: 10,
  maxRequiredSchemaFields: 8,
  vagueTermsExtensions: [],
  strict: false,
  descriptionSimilarityThreshold: 0.7,
  allowedScripts: [],
  personalDataPatterns: [],
  eval: {
    provider: 'command',
    command: null,
    model: null,
    baseUrl: 'https://api.openai.com/v1',
    threshold: 0.8,
  },
};

export function mergeConfig(overrides: Record<string, unknown>): Config {
  return {
    severities: isRecord(overrides.severities)
      ? { ...DEFAULT_CONFIG.severities, ...toSeverityMap(overrides.severities) }
      : { ...DEFAULT_CONFIG.severities },
    requiredSections: isStringArray(overrides.requiredSections)
      ? overrides.requiredSections
      : [...DEFAULT_CONFIG.requiredSections],
    maxSkillBodyLines: isNumber(overrides.maxSkillBodyLines)
      ? overrides.maxSkillBodyLines
      : DEFAULT_CONFIG.maxSkillBodyLines,
    minWorkedExamples: isNumber(overrides.minWorkedExamples)
      ? overrides.minWorkedExamples
      : DEFAULT_CONFIG.minWorkedExamples,
    minEvalCases: isNumber(overrides.minEvalCases)
      ? overrides.minEvalCases
      : DEFAULT_CONFIG.minEvalCases,
    maxRequiredSchemaFields: isNumber(overrides.maxRequiredSchemaFields)
      ? overrides.maxRequiredSchemaFields
      : DEFAULT_CONFIG.maxRequiredSchemaFields,
    vagueTermsExtensions: isStringArray(overrides.vagueTermsExtensions)
      ? [...new Set([...DEFAULT_CONFIG.vagueTermsExtensions, ...overrides.vagueTermsExtensions])]
      : [...DEFAULT_CONFIG.vagueTermsExtensions],
    strict: typeof overrides.strict === 'boolean' ? overrides.strict : DEFAULT_CONFIG.strict,
    descriptionSimilarityThreshold: isNumber(overrides.descriptionSimilarityThreshold)
      ? overrides.descriptionSimilarityThreshold
      : DEFAULT_CONFIG.descriptionSimilarityThreshold,
    allowedScripts: isStringArray(overrides.allowedScripts)
      ? overrides.allowedScripts
      : [...DEFAULT_CONFIG.allowedScripts],
    personalDataPatterns: isStringArray(overrides.personalDataPatterns)
      ? overrides.personalDataPatterns
      : [...DEFAULT_CONFIG.personalDataPatterns],
    eval: mergeEvalConfig(overrides.eval),
  };
}

function mergeEvalConfig(overrides: unknown): EvalConfig {
  if (!isRecord(overrides)) return { ...DEFAULT_CONFIG.eval };

  const provider =
    overrides.provider === 'command' ||
    overrides.provider === 'anthropic' ||
    overrides.provider === 'openai-compatible'
      ? overrides.provider
      : DEFAULT_CONFIG.eval.provider;

  return {
    provider,
    command:
      typeof overrides.command === 'string' ? overrides.command : DEFAULT_CONFIG.eval.command,
    model: typeof overrides.model === 'string' ? overrides.model : DEFAULT_CONFIG.eval.model,
    baseUrl:
      typeof overrides.baseUrl === 'string' ? overrides.baseUrl : DEFAULT_CONFIG.eval.baseUrl,
    threshold: isNumber(overrides.threshold) ? overrides.threshold : DEFAULT_CONFIG.eval.threshold,
  };
}

export function resolveSeverity(
  config: Config,
  ruleId: string,
  defaultSeverity: Severity,
): Severity {
  return config.severities[ruleId] ?? defaultSeverity;
}

export async function loadConfig(rootDir: string): Promise<Config> {
  const filePath = join(rootDir, 'codsy.config.yaml');
  const raw = await readFileIfExists(filePath);
  if (raw === null) return mergeConfig({});

  const parsed = loadYaml(raw);
  if (!isRecord(parsed)) {
    throw new Error(`${filePath} must contain a YAML mapping at the top level.`);
  }
  return mergeConfig(parsed);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toSeverityMap(value: Record<string, unknown>): Record<string, Severity> {
  const result: Record<string, Severity> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val === 'error' || val === 'warn' || val === 'off') {
      result[key] = val;
    }
  }
  return result;
}
