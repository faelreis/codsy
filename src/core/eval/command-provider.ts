import { spawn } from 'node:child_process';
import type { EvalProvider } from './provider';
import { ProviderConfigError } from './provider';

export class CommandProvider implements EvalProvider {
  constructor(private readonly command: string | null) {}

  async send(prompt: string): Promise<string> {
    if (!this.command) {
      throw new ProviderConfigError(
        'The "command" eval provider needs eval.command set in codsy.config.yaml.',
      );
    }

    return new Promise((resolve, reject) => {
      const child = spawn(this.command!, { shell: true });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`eval.command exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      child.stdin.write(prompt);
      child.stdin.end();
    });
  }
}
