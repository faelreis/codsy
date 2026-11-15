import { describe, expect, it, vi } from 'vitest';
import { OpenAiCompatibleProvider } from '../../../src/core/eval/openai-compatible-provider';
import { ProviderConfigError } from '../../../src/core/eval/provider';

function makeFakeFetch(responseBody: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(responseBody),
    text: () => Promise.resolve(JSON.stringify(responseBody)),
  });
}

describe('OpenAiCompatibleProvider', () => {
  it('throws a config error when no model is set, without making a request', async () => {
    const fetchImpl = vi.fn();
    const provider = new OpenAiCompatibleProvider(
      null,
      'https://api.openai.com/v1',
      'key',
      fetchImpl,
    );
    await expect(provider.send('hello')).rejects.toThrow(ProviderConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws a config error when no API key is set, without making a request', async () => {
    const fetchImpl = vi.fn();
    const provider = new OpenAiCompatibleProvider(
      'gpt-x',
      'https://api.openai.com/v1',
      undefined,
      fetchImpl,
    );
    await expect(provider.send('hello')).rejects.toThrow(ProviderConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts to <baseUrl>/chat/completions with a bearer token and the configured model', async () => {
    const fetchImpl = makeFakeFetch({ choices: [{ message: { content: 'hello back' } }] });
    const provider = new OpenAiCompatibleProvider(
      'gpt-x',
      'https://my-provider.example.com/v1',
      'secret-key',
      fetchImpl,
    );

    const text = await provider.send('what should I do?');

    expect(text).toBe('hello back');
    const call = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('https://my-provider.example.com/v1/chat/completions');
    expect(call[1].method).toBe('POST');
    const headers = call[1].headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer secret-key');
    const body = JSON.parse(call[1].body as string) as { model: string; messages: unknown };
    expect(body.model).toBe('gpt-x');
    expect(body.messages).toEqual([{ role: 'user', content: 'what should I do?' }]);
  });

  it('throws when the response is not ok', async () => {
    const fetchImpl = makeFakeFetch({ error: 'bad request' }, false, 400);
    const provider = new OpenAiCompatibleProvider(
      'gpt-x',
      'https://api.openai.com/v1',
      'secret-key',
      fetchImpl,
    );
    await expect(provider.send('hi')).rejects.toThrow(/400/);
  });

  it('throws when the response has no message content', async () => {
    const fetchImpl = makeFakeFetch({ choices: [] });
    const provider = new OpenAiCompatibleProvider(
      'gpt-x',
      'https://api.openai.com/v1',
      'secret-key',
      fetchImpl,
    );
    await expect(provider.send('hi')).rejects.toThrow(/no message content/);
  });
});
