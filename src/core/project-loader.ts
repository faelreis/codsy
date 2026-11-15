import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import {
  listDirectoryNames,
  listFileNames,
  listFilesRecursively,
  readFileIfExists,
} from './fs-helpers';
import { parseSkillMarkdown, type ParsedSkill } from './skill-parser';
import { isRecord } from './type-guards';

export interface SchemaFile {
  name: string;
  filePath: string;
  relativePath: string;
  raw: string;
  json: unknown;
  parseError: string | null;
}

export interface Skill extends ParsedSkill {
  dirName: string;
  filePath: string;
  relativePath: string;
  raw: string;
  files: string[];
}

export interface ContextFile {
  name: string;
  filePath: string;
  relativePath: string;
  raw: string;
}

export interface EvalCase {
  id: string;
  source: 'historical' | 'synthetic';
  input: unknown;
  expected: unknown;
}

export interface EvalSuite {
  skill: string | null;
  filePath: string;
  relativePath: string;
  raw: string;
  cases: EvalCase[];
  parseError: string | null;
}

export interface Project {
  rootDir: string;
  schemas: SchemaFile[];
  skills: Skill[];
  contextFiles: ContextFile[];
  evalSuites: EvalSuite[];
}

export async function loadProject(rootDir: string): Promise<Project> {
  const [schemas, skills, contextFiles, evalSuites] = await Promise.all([
    loadSchemas(rootDir),
    loadSkills(rootDir),
    loadContextFiles(rootDir),
    loadEvalSuites(rootDir),
  ]);
  return { rootDir, schemas, skills, contextFiles, evalSuites };
}

async function loadSchemas(rootDir: string): Promise<SchemaFile[]> {
  const dirPath = join(rootDir, 'schemas');
  const fileNames = (await listFileNames(dirPath)).filter((name) => name.endsWith('.schema.json'));

  return Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = join(dirPath, fileName);
      const raw = await readFile(filePath, 'utf8');
      let json: unknown;
      let parseError: string | null = null;
      try {
        json = JSON.parse(raw);
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
      }
      return {
        name: fileName.replace(/\.schema\.json$/, ''),
        filePath,
        relativePath: toPosixRelative(rootDir, filePath),
        raw,
        json,
        parseError,
      };
    }),
  );
}

async function loadSkills(rootDir: string): Promise<Skill[]> {
  const dirPath = join(rootDir, 'skills');
  const dirNames = await listDirectoryNames(dirPath);
  const skills: Skill[] = [];

  for (const dirName of dirNames) {
    const filePath = join(dirPath, dirName, 'SKILL.md');
    const raw = await readFileIfExists(filePath);
    if (raw === null) continue;
    const parsed = parseSkillMarkdown(raw);
    const files = (await listFilesRecursively(join(dirPath, dirName))).filter(
      (name) => name !== 'SKILL.md',
    );
    skills.push({
      ...parsed,
      dirName,
      filePath,
      relativePath: toPosixRelative(rootDir, filePath),
      raw,
      files,
    });
  }

  return skills;
}

async function loadContextFiles(rootDir: string): Promise<ContextFile[]> {
  const dirPath = join(rootDir, 'context');
  const fileNames = (await listFileNames(dirPath)).filter((name) => name.endsWith('.md'));

  return Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = join(dirPath, fileName);
      const raw = await readFile(filePath, 'utf8');
      return {
        name: fileName.replace(/\.md$/, ''),
        filePath,
        relativePath: toPosixRelative(rootDir, filePath),
        raw,
      };
    }),
  );
}

async function loadEvalSuites(rootDir: string): Promise<EvalSuite[]> {
  const dirPath = join(rootDir, 'evals');
  const dirNames = await listDirectoryNames(dirPath);
  const suites: EvalSuite[] = [];

  for (const dirName of dirNames) {
    const filePath = join(dirPath, dirName, 'cases.yaml');
    const raw = await readFileIfExists(filePath);
    if (raw === null) continue;

    let skill: string | null = null;
    let cases: EvalCase[] = [];
    let parseError: string | null = null;
    try {
      const parsed = loadYaml(raw);
      if (isRecord(parsed)) {
        skill = typeof parsed.skill === 'string' ? parsed.skill : null;
        cases = Array.isArray(parsed.cases) ? (parsed.cases as EvalCase[]) : [];
      }
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }

    suites.push({
      skill,
      filePath,
      relativePath: toPosixRelative(rootDir, filePath),
      raw,
      cases,
      parseError,
    });
  }

  return suites;
}

function toPosixRelative(rootDir: string, filePath: string): string {
  return relative(rootDir, filePath).split('\\').join('/');
}
