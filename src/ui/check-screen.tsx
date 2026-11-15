import type { Diagnostic } from '../core/diagnostic';
import { detectCapabilitiesFromProcess } from './capabilities';
import { formatRichText } from './check-rich-format';

export function renderCheckScreen(diagnostics: Diagnostic[]): void {
  const capabilities = detectCapabilitiesFromProcess({
    plainFlag: false,
    noMotionFlag: false,
    format: 'pretty',
  });
  process.stdout.write(formatRichText(diagnostics, capabilities.colorLevel));
}
