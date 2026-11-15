import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Wizard } from '../../src/ui/new-schema-wizard';

const TICK = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

async function type(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await TICK();
  stdin.write('\r');
  await TICK();
}

describe('new schema Wizard', () => {
  it('asks for the schema name first', () => {
    const { lastFrame } = render(<Wizard onDone={() => {}} />);
    expect(lastFrame()).toContain('What should this schema be called?');
  });

  it('walks through name, description, one field, and finishes on "n"', async () => {
    const onDone = vi.fn();
    const { stdin } = render(<Wizard onDone={onDone} />);

    await type(stdin, 'order');
    await type(stdin, 'An order record.');
    await type(stdin, 'total_usd');
    await type(stdin, 'number');
    await type(stdin, 'The order total in US dollars.');
    await type(stdin, 'n');

    expect(onDone).toHaveBeenCalledWith({
      name: 'order',
      description: 'An order record.',
      fields: [
        { name: 'total_usd', type: 'number', description: 'The order total in US dollars.' },
      ],
    });
  });

  it('cancels with onDone(null) on escape at the very first step', async () => {
    const onDone = vi.fn();
    const { stdin } = render(<Wizard onDone={onDone} />);

    stdin.write('\x1b');
    await TICK();

    expect(onDone).toHaveBeenCalledWith(null);
  });

  it('cancels with onDone(null) on escape partway through the flow', async () => {
    const onDone = vi.fn();
    const { lastFrame, stdin } = render(<Wizard onDone={onDone} />);

    await type(stdin, 'order');
    expect(lastFrame()).toContain('What is this schema for');

    stdin.write('\x1b');
    await TICK();

    expect(onDone).toHaveBeenCalledWith(null);
  });
});
