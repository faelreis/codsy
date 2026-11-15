import type { EvalProvider } from './provider';
import { ProviderConfigError } from './provider';

const ANTHROPIC_API_VERSION = '2023-06-01';
const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const MAX_TOKENS = 1024;

export class AnthropicProvider implements EvalProvider {
  constructor(
    private readonly model: string | null,
    private readonly apiKey: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(prompt: string): Promise<string> {
    if (!this.model) {
      throw new ProviderConfigError(
        'The "anthropic" eval provider needs eval.model set in codsy.config.yaml.',
      );
    }
    if (!this.apiKey) {
      throw new ProviderConfigError(
        'The "anthropic" eval provider needs ANTHROPIC_API_KEY set in the environment.',
      );
    }

    const response = await this.fetchImpl(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((block) => block.type === 'text')?.text;
    if (text === undefined) {
      throw new Error('Anthropic API response had no text content.');
    }
    return text;
  }
}
