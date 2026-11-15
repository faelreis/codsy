import { describe, expect, it } from 'vitest';
import { parseAnswer } from '../../../src/core/eval/parse-answer';

describe('parseAnswer', () => {
  it('parses a plain JSON object', () => {
    expect(parseAnswer('{"decision": "sales"}')).toEqual({ decision: 'sales' });
  });

  it('parses JSON wrapped in a fenced code block', () => {
    const response = 'Here is my answer:\n```json\n{"decision": "sales"}\n```';
    expect(parseAnswer(response)).toEqual({ decision: 'sales' });
  });

  it('parses JSON wrapped in a fence with no language tag', () => {
    const response = '```\n{"decision": "sales"}\n```';
    expect(parseAnswer(response)).toEqual({ decision: 'sales' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseAnswer('not json at all')).toBeNull();
  });

  it('returns null for valid JSON that is not an object', () => {
    expect(parseAnswer('"just a string"')).toBeNull();
    expect(parseAnswer('[1, 2, 3]')).toBeNull();
  });
});
