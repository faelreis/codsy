import type { Rule } from './rule-engine';
import { schemaRules } from '../rules/schema-rules';
import { skillStructureRules } from '../rules/skill-structure-rules';
import { skillQualityRules } from '../rules/skill-quality-rules';
import { securityRules } from '../rules/security-rules';

export const ALL_RULES: Rule[] = [
  ...schemaRules,
  ...skillStructureRules,
  ...skillQualityRules,
  ...securityRules,
];
