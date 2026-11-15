import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadProject } from '../core/project-loader';

export interface ProjectStatus {
  inProject: boolean;
  skillCount: number;
  schemaCount: number;
  contextFileCount: number;
}

export async function detectProjectStatus(rootDir: string): Promise<ProjectStatus> {
  const inProject = existsSync(join(rootDir, 'codsy.config.yaml'));
  if (!inProject) {
    return { inProject: false, skillCount: 0, schemaCount: 0, contextFileCount: 0 };
  }

  const project = await loadProject(rootDir);
  return {
    inProject: true,
    skillCount: project.skills.length,
    schemaCount: project.schemas.length,
    contextFileCount: project.contextFiles.length,
  };
}

export function statusLine(status: ProjectStatus): string {
  return `${status.skillCount} skills · ${status.schemaCount} schemas · ${status.contextFileCount} context files`;
}

export interface HomeMenuItem {
  label: string;
  command: string;
}

export const HOME_MENU_ITEMS: readonly HomeMenuItem[] = [
  { label: 'Start a new project', command: 'codsy init' },
  { label: 'Add a skill', command: 'codsy new skill' },
  { label: 'Check my project', command: 'codsy check' },
  { label: 'Run evals', command: 'codsy eval' },
  { label: 'Learn the basics', command: 'codsy explain CODSY010' },
];

const ONE_LINE_DESCRIPTION =
  'Codsy helps you write operational knowledge as versioned files people and AI agents can both read.';

export function formatPlainHome(status: ProjectStatus): string {
  const lines = [ONE_LINE_DESCRIPTION, ''];
  if (status.inProject) {
    lines.push(statusLine(status), '');
  }
  lines.push('Commands:');
  for (const item of HOME_MENU_ITEMS) {
    lines.push(`  ${item.command}  — ${item.label}`);
  }
  return `${lines.join('\n')}\n`;
}

export interface RunHomeOptions {
  rootDir: string;
  write: (text: string) => void;
  isInteractive: boolean;
  renderRichHome?: ((status: ProjectStatus) => Promise<void>) | undefined;
}

export async function runHomeCommand(options: RunHomeOptions): Promise<number> {
  const status = await detectProjectStatus(options.rootDir);

  if (options.isInteractive && options.renderRichHome) {
    await options.renderRichHome(status);
  } else {
    options.write(formatPlainHome(status));
  }

  return 0;
}
