export type ColorLevel = 'truecolor' | '256' | '16' | 'none';
export type OutputFormat = 'pretty' | 'json' | 'sarif';

export interface CapabilityInput {
  isTTY: boolean;
  columns: number | undefined;
  colorDepth: number | undefined;
  env: Readonly<Record<string, string | undefined>>;
  plainFlag: boolean;
  noMotionFlag: boolean;
  format: OutputFormat | undefined;
}

export interface Capabilities {
  isTTY: boolean;
  width: number;
  colorLevel: ColorLevel;
  motionEnabled: boolean;
  plain: boolean;
}

const DEFAULT_WIDTH = 80;

export function detectCapabilities(input: CapabilityInput): Capabilities {
  const plain =
    !input.isTTY ||
    input.plainFlag ||
    input.format === 'json' ||
    input.format === 'sarif' ||
    Boolean(input.env.NO_COLOR) ||
    Boolean(input.env.CI);

  const colorLevel: ColorLevel = plain ? 'none' : colorLevelFromDepth(input.colorDepth);
  const motionEnabled = !plain && !input.noMotionFlag && !input.env.CODSY_NO_MOTION;
  const width = input.columns ?? DEFAULT_WIDTH;

  return { isTTY: input.isTTY, width, colorLevel, motionEnabled, plain };
}

export function detectCapabilitiesFromProcess(options: {
  plainFlag: boolean;
  noMotionFlag: boolean;
  format: OutputFormat | undefined;
}): Capabilities {
  const stream = process.stdout;
  const isTTY = Boolean(stream.isTTY);
  return detectCapabilities({
    isTTY,
    columns: stream.columns,
    colorDepth:
      isTTY && typeof stream.getColorDepth === 'function' ? stream.getColorDepth() : undefined,
    env: process.env,
    plainFlag: options.plainFlag,
    noMotionFlag: options.noMotionFlag,
    format: options.format,
  });
}

function colorLevelFromDepth(depth: number | undefined): ColorLevel {
  switch (depth) {
    case 24:
      return 'truecolor';
    case 8:
      return '256';
    case 4:
      return '16';
    default:
      return 'none';
  }
}
