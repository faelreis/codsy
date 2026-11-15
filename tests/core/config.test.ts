import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, loadConfig, mergeConfig, resolveSeverity } from '../../src/core/config';

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('mergeConfig', () => {
  it('returns the defaults when given no overrides', () => {
    expect(mergeConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it('overrides individual numeric and array fields', () => {
    const config = mergeConfig({ maxSkillBodyLines: 100, requiredSections: ['Purpose'] });
    expect(config.maxSkillBodyLines).toBe(100);
    expect(config.requiredSections).toEqual(['Purpose']);
  });

  it('extends rather than replaces vagueTermsExtensions', () => {
    const config = mergeConfig({ vagueTermsExtensions: ['big client'] });
    expect(config.vagueTermsExtensions).toContain('big client');
  });

  it('ignores malformed override values and falls back to defaults', () => {
    const config = mergeConfig({ maxSkillBodyLines: 'not a number', requiredSections: 42 });
    expect(config.maxSkillBodyLines).toBe(DEFAULT_CONFIG.maxSkillBodyLines);
    expect(config.requiredSections).toEqual(DEFAULT_CONFIG.requiredSections);
  });

  it('only accepts known severity values', () => {
    const config = mergeConfig({ severities: { CODSY001: 'error', CODSY002: 'nonsense' } });
    expect(config.severities.CODSY001).toBe('error');
    expect(config.severities.CODSY002).toBeUndefined();
  });

  it('merges a nested eval config, falling back field by field', () => {
    const config = mergeConfig({ eval: { provider: 'anthropic', model: 'claude-x' } });
    expect(config.eval).toEqual({
      provider: 'anthropic',
      command: null,
      model: 'claude-x',
      baseUrl: DEFAULT_CONFIG.eval.baseUrl,
      threshold: DEFAULT_CONFIG.eval.threshold,
    });
  });

  it('falls back to the default eval config when eval is missing or malformed', () => {
    expect(mergeConfig({}).eval).toEqual(DEFAULT_CONFIG.eval);
    expect(mergeConfig({ eval: 'not an object' }).eval).toEqual(DEFAULT_CONFIG.eval);
  });

  it('ignores an unknown eval provider name', () => {
    const config = mergeConfig({ eval: { provider: 'carrier-pigeon' } });
    expect(config.eval.provider).toBe(DEFAULT_CONFIG.eval.provider);
  });
});

describe('resolveSeverity', () => {
  it('falls back to the rule default when not overridden', () => {
    expect(resolveSeverity(DEFAULT_CONFIG, 'CODSY001', 'error')).toBe('error');
  });

  it('uses the configured override when present', () => {
    const config = mergeConfig({ severities: { CODSY001: 'off' } });
    expect(resolveSeverity(config, 'CODSY001', 'error')).toBe('off');
  });
});

describe('loadConfig', () => {
  it('merges a project config file with the defaults', async () => {
    const config = await loadConfig(join(FIXTURES_DIR, 'project-basic'));
    expect(config.maxSkillBodyLines).toBe(250);
    expect(config.vagueTermsExtensions).toContain('big client');
  });

  it('returns the defaults when no config file exists', async () => {
    const config = await loadConfig(join(FIXTURES_DIR, 'project-empty'));
    expect(config).toEqual(DEFAULT_CONFIG);
  });
});
