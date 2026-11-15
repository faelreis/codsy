export interface NamedPattern {
  name: string;
  pattern: RegExp;
}

export const SECRET_PATTERNS: readonly NamedPattern[] = [
  { name: 'AWS access key ID', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub token', pattern: /gh[pousr]_[A-Za-z0-9]{36,}/g },
  { name: 'Slack token', pattern: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
  {
    name: 'private key block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/g,
  },
  {
    name: 'assigned secret value',
    pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[A-Za-z0-9_\-./+=]{16,}['"]?/gi,
  },
];

export const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore (?:all )?previous instructions/gi,
  /disregard (?:the )?system prompt/gi,
  /you are now (?:in )?(?:developer|dan) mode/gi,
  /reveal your (?:system prompt|instructions)/gi,
  /do anything now/gi,
  /act as if you have no (?:restrictions|limitations)/gi,
];
