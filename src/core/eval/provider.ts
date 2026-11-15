export interface EvalProvider {
  send(prompt: string): Promise<string>;
}

export class ProviderConfigError extends Error {}
