import { describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from '../../../src/core/eval/anthropic-provider';
import { ProviderConfigError } from '../../../src/core/eval/provider';

function makeFakeFetch(responseBody: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(responseBody),
    text: () => Promise.resolve(JSON.stringify(responseBody)),
  });
}

describe('AnthropicProvider', () => {
  it('throws a config error when no model is set, without making a request', async () => {
    const fetchImpl = vi.fn();
    const provider = new AnthropicProvider(null, 'key', fetchImpl);
    await expect(provider.send('hello')).rejects.toThrow(ProviderConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws a config error when no API key is set, without making a request', async () => {
    const fetchImpl = vi.fn();
    const provider = new AnthropicProvider('claude-x', undefined, fetchImpl);
    await expect(provider.send('hello')).rejects.toThrow(ProviderConfigError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the correct endpoint, headers, and body', async () => {
    const fetchImpl = makeFakeFetch({ content: [{ type: 'text', text: 'hello back' }] });
    const provider = new AnthropicProvider('claude-x', 'secret-key', fetchImpl);

    const text = await provider.send('what should I do?');

    expect(text).toBe('hello back');
    const call = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('https://api.anthropic.com/v1/messages');
    expect(call[1].method).toBe('POST');
    const headers = call[1].headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('secret-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse(call[1].body as string) as { model: string; messages: unknown };
    expect(body.model).toBe('claude-x');
    expect(body.messages).toEqual([{ role: 'user', content: 'what should I do?' }]);
  });

  it('throws when the response is not ok', async () => {
    const fetchImpl = makeFakeFetch({ error: 'bad request' }, false, 400);
    const provider = new AnthropicProvider('claude-x', 'secret-key', fetchImpl);
    await expect(provider.send('hi')).rejects.toThrow(/400/);
  });

  it('throws when the response has no text content block', async () => {
    const fetchImpl = makeFakeFetch({ content: [{ type: 'image' }] });
    const provider = new AnthropicProvider('claude-x', 'secret-key', fetchImpl);
    await expect(provider.send('hi')).rejects.toThrow(/no text content/);
  });
});
