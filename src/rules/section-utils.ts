import type { SkillSection } from '../core/skill-parser';

export function findSection(sections: SkillSection[], heading: string): SkillSection | null {
  const target = heading.trim().toLowerCase();
  for (const section of sections) {
    if (section.heading.trim().toLowerCase() === target) return section;
    const found = findSection(section.children, heading);
    if (found) return found;
  }
  return null;
}

export function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

export function collectSectionText(section: SkillSection): string {
  const childText = section.children.map(collectSectionText).join('\n');
  return [section.body, childText].filter((part) => part.length > 0).join('\n');
}
