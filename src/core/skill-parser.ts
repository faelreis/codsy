import { load as loadYaml } from 'js-yaml';
import { isRecord } from './type-guards';

export interface SkillMetadata {
  owner?: string;
  last_reviewed?: string;
  review_every_days?: number;
  schemas?: string[];
}

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  metadata?: SkillMetadata;
}

export interface SkillSection {
  heading: string;
  level: number;
  line: number;
  body: string;
  children: SkillSection[];
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  frontmatterError: string | null;
  bodyStartLine: number;
  sections: SkillSection[];
}

const FRONTMATTER_FENCE = '---';
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/;

export function parseSkillMarkdown(raw: string): ParsedSkill {
  const lines = raw.split('\n');
  const { frontmatter, frontmatterError, bodyStartLine } = extractFrontmatter(lines);
  const sections = buildSectionTree(lines, bodyStartLine);
  return { frontmatter, frontmatterError, bodyStartLine, sections };
}

interface FrontmatterResult {
  frontmatter: SkillFrontmatter;
  frontmatterError: string | null;
  bodyStartLine: number;
}

function extractFrontmatter(lines: string[]): FrontmatterResult {
  if ((lines[0] ?? '').trim() !== FRONTMATTER_FENCE) {
    return {
      frontmatter: {},
      frontmatterError: 'Missing YAML frontmatter fence (---) at the top of the file.',
      bodyStartLine: 1,
    };
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === FRONTMATTER_FENCE,
  );
  if (closingIndex === -1) {
    return {
      frontmatter: {},
      frontmatterError: 'Frontmatter is missing its closing --- line.',
      bodyStartLine: 1,
    };
  }

  const yamlText = lines.slice(1, closingIndex).join('\n');
  try {
    const parsed = loadYaml(yamlText);
    const frontmatter = isRecord(parsed) ? (parsed as SkillFrontmatter) : {};
    return { frontmatter, frontmatterError: null, bodyStartLine: closingIndex + 2 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      frontmatter: {},
      frontmatterError: `Frontmatter is not valid YAML: ${message}`,
      bodyStartLine: closingIndex + 2,
    };
  }
}

function buildSectionTree(lines: string[], bodyStartLine: number): SkillSection[] {
  interface FlatHeading {
    level: number;
    line: number;
    heading: string;
  }

  const flat: FlatHeading[] = [];
  for (let i = bodyStartLine - 1; i < lines.length; i += 1) {
    const match = HEADING_PATTERN.exec(lines[i] ?? '');
    const level = match?.[1];
    const heading = match?.[2];
    if (level !== undefined && heading !== undefined) {
      flat.push({ level: level.length, line: i + 1, heading });
    }
  }

  const nodes: SkillSection[] = flat.map((entry, index) => {
    const nextLine = flat[index + 1]?.line ?? lines.length + 1;
    const body = lines
      .slice(entry.line, nextLine - 1)
      .join('\n')
      .trim();
    return { heading: entry.heading, level: entry.level, line: entry.line, body, children: [] };
  });

  const roots: SkillSection[] = [];
  const stack: SkillSection[] = [];

  nodes.forEach((node) => {
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top && top.level >= node.level) {
        stack.pop();
      } else {
        break;
      }
    }
    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
    stack.push(node);
  });

  return roots;
}
