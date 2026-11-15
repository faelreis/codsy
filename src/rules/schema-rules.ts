import Ajv2020 from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import { resolveSeverity } from '../core/config';
import type { Diagnostic } from '../core/diagnostic';
import type { Rule } from '../core/rule-engine';
import type { SchemaFile } from '../core/project-loader';
import { isRecord } from '../core/type-guards';

interface CompiledSchema {
  validate: ValidateFunction | null;
  error: string | null;
}

function compileOneSchema(schema: SchemaFile): CompiledSchema {
  if (schema.parseError) return { validate: null, error: schema.parseError };

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  try {
    const validate = ajv.compile(schema.json as Record<string, unknown>);
    return { validate, error: null };
  } catch (error) {
    return { validate: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function compileSchemasByName(schemas: SchemaFile[]): Map<string, CompiledSchema> {
  const map = new Map<string, CompiledSchema>();
  for (const schema of schemas) {
    map.set(schema.name, compileOneSchema(schema));
  }
  return map;
}

function walkSchemaNodes(
  node: unknown,
  path: string,
  visit: (node: Record<string, unknown>, path: string) => void,
): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => walkSchemaNodes(item, `${path}[${index}]`, visit));
    return;
  }
  if (isRecord(node)) {
    visit(node, path);
    for (const [key, value] of Object.entries(node)) {
      walkSchemaNodes(value, path ? `${path}.${key}` : key, visit);
    }
  }
}

function hasNonEmptyDescription(node: Record<string, unknown>): boolean {
  return typeof node.description === 'string' && node.description.trim().length > 0;
}

function findPropertiesWithoutDescription(schema: unknown): string[] {
  const missing: string[] = [];
  walkSchemaNodes(schema, '', (node, path) => {
    if (!isRecord(node.properties)) return;
    for (const [propName, propSchema] of Object.entries(node.properties)) {
      if (!isRecord(propSchema) || !hasNonEmptyDescription(propSchema)) {
        missing.push(path ? `${path}.properties.${propName}` : `properties.${propName}`);
      }
    }
  });
  return missing;
}

function findOversizedRequiredLists(
  schema: unknown,
  limit: number,
): Array<{ path: string; count: number }> {
  const results: Array<{ path: string; count: number }> = [];
  walkSchemaNodes(schema, '', (node, path) => {
    const required = node.required;
    if (Array.isArray(required) && required.length > limit) {
      results.push({ path: path || '(root)', count: required.length });
    }
  });
  return results;
}

function findUndocumentedEnums(schema: unknown): string[] {
  const results: string[] = [];
  walkSchemaNodes(schema, '', (node, path) => {
    if (Array.isArray(node.enum) && !hasNonEmptyDescription(node)) {
      results.push(path || '(root)');
    }
  });
  return results;
}

export const codsy100InvalidSchema: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY100', 'error');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const schema of project.schemas) {
    if (schema.parseError) {
      diagnostics.push({
        ruleId: 'CODSY100',
        severity,
        file: schema.relativePath,
        line: 1,
        message: `${schema.relativePath} is not valid JSON: ${schema.parseError}`,
        fixHint: 'Fix the JSON syntax so the file can be parsed.',
      });
      continue;
    }

    const compiled = compileOneSchema(schema);
    if (compiled.error) {
      diagnostics.push({
        ruleId: 'CODSY100',
        severity,
        file: schema.relativePath,
        line: 1,
        message: `${schema.relativePath} is not a valid JSON Schema: ${compiled.error}`,
        fixHint: 'Fix the schema so it validates against the JSON Schema 2020-12 meta-schema.',
      });
    }
  }
  return diagnostics;
};

export const codsy101MissingPropertyDescription: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY101', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const schema of project.schemas) {
    if (schema.parseError) continue;
    for (const path of findPropertiesWithoutDescription(schema.json)) {
      diagnostics.push({
        ruleId: 'CODSY101',
        severity,
        file: schema.relativePath,
        line: 1,
        message: `Property '${path}' has no description.`,
        fixHint: `Add a "description" field explaining what '${path}' means.`,
      });
    }
  }
  return diagnostics;
};

export const codsy102TooManyRequiredFields: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY102', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const schema of project.schemas) {
    if (schema.parseError) continue;
    for (const { path, count } of findOversizedRequiredLists(
      schema.json,
      config.maxRequiredSchemaFields,
    )) {
      diagnostics.push({
        ruleId: 'CODSY102',
        severity,
        file: schema.relativePath,
        line: 1,
        message: `'${path}' requires ${count} fields, more than the limit of ${config.maxRequiredSchemaFields}.`,
        fixHint: 'Split this schema or make some of these fields optional.',
      });
    }
  }
  return diagnostics;
};

export const codsy103UndocumentedEnum: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY103', 'warn');
  if (severity === 'off') return [];

  const diagnostics: Diagnostic[] = [];
  for (const schema of project.schemas) {
    if (schema.parseError) continue;
    for (const path of findUndocumentedEnums(schema.json)) {
      diagnostics.push({
        ruleId: 'CODSY103',
        severity,
        file: schema.relativePath,
        line: 1,
        message: `Enum at '${path}' has no description explaining what its values mean.`,
        fixHint: `Add a "description" to '${path}' that explains each allowed value.`,
      });
    }
  }
  return diagnostics;
};

export const codsy104MissingSchemaReference: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY104', 'error');
  if (severity === 'off') return [];

  const schemaNames = new Set(project.schemas.map((schema) => schema.name));
  const diagnostics: Diagnostic[] = [];

  for (const skill of project.skills) {
    for (const name of referencedSchemaNames(skill.frontmatter.metadata?.schemas)) {
      if (!schemaNames.has(name)) {
        diagnostics.push({
          ruleId: 'CODSY104',
          severity,
          file: skill.relativePath,
          line: 1,
          message: `Skill '${skill.dirName}' references schema '${name}', but schemas/${name}.schema.json does not exist.`,
          fixHint: `Create schemas/${name}.schema.json, or fix the schema name in SKILL.md.`,
        });
      }
    }
  }
  return diagnostics;
};

export const codsy105EvalInputFailsSchema: Rule = (project, config) => {
  const severity = resolveSeverity(config, 'CODSY105', 'error');
  if (severity === 'off') return [];

  const compiledByName = compileSchemasByName(project.schemas);
  const skillsByName = new Map(project.skills.map((skill) => [skill.dirName, skill]));
  const diagnostics: Diagnostic[] = [];

  for (const suite of project.evalSuites) {
    if (!suite.skill) continue;
    const skill = skillsByName.get(suite.skill);
    if (!skill) continue;

    for (const schemaName of referencedSchemaNames(skill.frontmatter.metadata?.schemas)) {
      const compiled = compiledByName.get(schemaName);
      if (!compiled?.validate) continue;
      const validate = compiled.validate;

      for (const evalCase of suite.cases) {
        if (validate(evalCase.input)) continue;
        const errorText = (validate.errors ?? [])
          .map((error) => `${error.instancePath || '(root)'} ${error.message ?? ''}`.trim())
          .join('; ');
        diagnostics.push({
          ruleId: 'CODSY105',
          severity,
          file: suite.relativePath,
          line: 1,
          message: `Case '${evalCase.id}' input does not match schema '${schemaName}': ${errorText || 'does not match the schema'}.`,
          fixHint: `Fix the input in evals/${skill.dirName}/cases.yaml, or update schemas/${schemaName}.schema.json.`,
        });
      }
    }
  }
  return diagnostics;
};

function referencedSchemaNames(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export const schemaRules: Rule[] = [
  codsy100InvalidSchema,
  codsy101MissingPropertyDescription,
  codsy102TooManyRequiredFields,
  codsy103UndocumentedEnum,
  codsy104MissingSchemaReference,
  codsy105EvalInputFailsSchema,
];
