import type { NamedPattern } from './secret-patterns';

const EXEMPT_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'test.com',
]);

export const EMAIL_PATTERN_NAME = 'email address';

export const DEFAULT_PERSONAL_DATA_PATTERNS: readonly NamedPattern[] = [
  { name: EMAIL_PATTERN_NAME, pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  {
    name: 'US phone number',
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  { name: 'US Social Security number', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
];

export function isExemptEmailMatch(match: string): boolean {
  const domain = match.split('@')[1]?.toLowerCase();
  return domain !== undefined && EXEMPT_EMAIL_DOMAINS.has(domain);
}
