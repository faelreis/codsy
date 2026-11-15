import { describe, expect, it } from 'vitest';
import { detectCapabilities } from '../../src/ui/capabilities';
import type { CapabilityInput } from '../../src/ui/capabilities';

function makeInput(overrides: Partial<CapabilityInput> = {}): CapabilityInput {
  return {
    isTTY: true,
    columns: 100,
    colorDepth: 24,
    env: {},
    plainFlag: false,
    noMotionFlag: false,
    format: undefined,
    ...overrides,
  };
}

describe('detectCapabilities', () => {
  it('detects a rich interactive terminal', () => {
    const capabilities = detectCapabilities(makeInput());
    expect(capabilities).toEqual({
      isTTY: true,
      width: 100,
      colorLevel: 'truecolor',
      motionEnabled: true,
      plain: false,
    });
  });

  it('falls back to plain when not a TTY', () => {
    const capabilities = detectCapabilities(makeInput({ isTTY: false, columns: undefined }));
    expect(capabilities.plain).toBe(true);
    expect(capabilities.colorLevel).toBe('none');
    expect(capabilities.motionEnabled).toBe(false);
    expect(capabilities.width).toBe(80);
  });

  it('falls back to plain when --plain is passed', () => {
    expect(detectCapabilities(makeInput({ plainFlag: true })).plain).toBe(true);
  });

  it('falls back to plain for json and sarif formats', () => {
    expect(detectCapabilities(makeInput({ format: 'json' })).plain).toBe(true);
    expect(detectCapabilities(makeInput({ format: 'sarif' })).plain).toBe(true);
  });

  it('falls back to plain when NO_COLOR is set', () => {
    expect(detectCapabilities(makeInput({ env: { NO_COLOR: '1' } })).plain).toBe(true);
  });

  it('falls back to plain in CI', () => {
    expect(detectCapabilities(makeInput({ env: { CI: 'true' } })).plain).toBe(true);
  });

  it('disables motion via --no-motion without forcing plain output', () => {
    const capabilities = detectCapabilities(makeInput({ noMotionFlag: true }));
    expect(capabilities.motionEnabled).toBe(false);
    expect(capabilities.plain).toBe(false);
    expect(capabilities.colorLevel).toBe('truecolor');
  });

  it('disables motion via CODSY_NO_MOTION without forcing plain output', () => {
    const capabilities = detectCapabilities(makeInput({ env: { CODSY_NO_MOTION: '1' } }));
    expect(capabilities.motionEnabled).toBe(false);
    expect(capabilities.plain).toBe(false);
  });

  it.each([
    [24, 'truecolor'],
    [8, '256'],
    [4, '16'],
    [1, 'none'],
    [undefined, 'none'],
  ] as const)('maps color depth %s to level %s', (depth, level) => {
    expect(detectCapabilities(makeInput({ colorDepth: depth })).colorLevel).toBe(level);
  });

  it('falls back to a width of 80 when columns is undefined', () => {
    expect(detectCapabilities(makeInput({ columns: undefined })).width).toBe(80);
  });
});
