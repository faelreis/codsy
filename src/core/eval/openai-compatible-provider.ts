import type { EvalProvider } from './provider';
import { ProviderConfigError } from './provider';

export class OpenAiCompatibleProvider implements EvalProvider {
  constructor(
    private readonly model: string | null,
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(prompt: string): Promise<string> {
    if (!this.model) {
      throw new ProviderConfigError(
        'The "openai-compatible" eval provider needs eval.model set in codsy.config.yaml.',
      );
    }
    if (!this.apiKey) {
      throw new ProviderConfigError(
        'The "openai-compatible" eval provider needs OPENAI_API_KEY set in the environment.',
      );
    }

    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI-compatible API request failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (text === undefined) {
      throw new Error('OpenAI-compatible API response had no message content.');
    }
    return text;
  }
}
