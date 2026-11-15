import { describe, expect, it } from 'vitest';
import { createProvider } from '../../../src/core/eval/create-provider';
import { AnthropicProvider } from '../../../src/core/eval/anthropic-provider';
import { CommandProvider } from '../../../src/core/eval/command-provider';
import { OpenAiCompatibleProvider } from '../../../src/core/eval/openai-compatible-provider';
import { DEFAULT_CONFIG } from '../../../src/core/config';

describe('createProvider', () => {
  it('creates a CommandProvider by default', () => {
    expect(createProvider(DEFAULT_CONFIG.eval, {})).toBeInstanceOf(CommandProvider);
  });

  it('creates an AnthropicProvider for the anthropic provider name', () => {
    const provider = createProvider(
      { ...DEFAULT_CONFIG.eval, provider: 'anthropic', model: 'claude-x' },
      { ANTHROPIC_API_KEY: 'key' },
    );
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('creates an OpenAiCompatibleProvider for the openai-compatible provider name', () => {
    const provider = createProvider(
      { ...DEFAULT_CONFIG.eval, provider: 'openai-compatible', model: 'gpt-x' },
      { OPENAI_API_KEY: 'key' },
    );
    expect(provider).toBeInstanceOf(OpenAiCompatibleProvider);
  });
});
