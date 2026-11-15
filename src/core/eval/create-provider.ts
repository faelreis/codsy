import type { EvalConfig } from '../config';
import { AnthropicProvider } from './anthropic-provider';
import { CommandProvider } from './command-provider';
import { OpenAiCompatibleProvider } from './openai-compatible-provider';
import type { EvalProvider } from './provider';

export function createProvider(
  config: EvalConfig,
  env: Readonly<Record<string, string | undefined>> = process.env,
): EvalProvider {
  if (config.provider === 'anthropic') {
    return new AnthropicProvider(config.model, env.ANTHROPIC_API_KEY);
  }
  if (config.provider === 'openai-compatible') {
    return new OpenAiCompatibleProvider(config.model, config.baseUrl, env.OPENAI_API_KEY);
  }
  return new CommandProvider(config.command);
}
