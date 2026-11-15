import { isRecord } from '../type-guards';

const FENCED_JSON_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i;

export function parseAnswer(rawResponse: string): Record<string, unknown> | null {
  const fenced = FENCED_JSON_PATTERN.exec(rawResponse);
  const candidate = fenced ? fenced[1] : rawResponse;
  if (candidate === undefined) return null;

  try {
    const parsed: unknown = JSON.parse(candidate.trim());
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
