import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Wizard } from '../../src/ui/new-skill-wizard';

const TICK = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

async function type(stdin: { write: (data: string) => void }, text: string): Promise<void> {
  stdin.write(text);
  await TICK();
  stdin.write('\r');
  await TICK();
}

const ANSWERS = [
  'order-escalation',
  'ops',
  'Decide whether an order should be escalated.',
  'an order is flagged as delayed.',
  'an order record.',
  'escalate if delayed more than 3 days.',
  'none known.',
  'a decision.',
  'a 5-day-delayed order escalates.',
  'a 1-day-delayed order does not escalate.',
];

describe('new skill Wizard', () => {
  it('asks one question per step and shows a step indicator', () => {
    const { lastFrame } = render(<Wizard onDone={() => {}} />);
    expect(lastFrame()).toContain('Step 1 of 10');
    expect(lastFrame()).toContain('What should this skill be called');
  });

  it('updates the live preview as the name is entered', async () => {
    const { lastFrame, stdin } = render(<Wizard onDone={() => {}} />);
    await type(stdin, 'order-escalation');

    expect(lastFrame()).toContain('name: order-escalation');
    expect(lastFrame()).toContain('Step 2 of 10');
  });

  it('calls onDone with the full assembled answers after all ten steps', async () => {
    const onDone = vi.fn();
    const { stdin } = render(<Wizard onDone={onDone} />);

    for (const answer of ANSWERS) {
      await type(stdin, answer);
    }

    expect(onDone).toHaveBeenCalledWith({
      name: 'order-escalation',
      owner: 'ops',
      purpose: 'Decide whether an order should be escalated.',
      whenToUse: 'an order is flagged as delayed.',
      input: 'an order record.',
      decisionLogic: 'escalate if delayed more than 3 days.',
      exceptions: 'none known.',
      output: 'a decision.',
      examples: ['a 5-day-delayed order escalates.', 'a 1-day-delayed order does not escalate.'],
    });
  });

  it('ignores an empty submission and stays on the same step', async () => {
    const { lastFrame, stdin } = render(<Wizard onDone={() => {}} />);
    stdin.write('\r');
    await TICK();

    expect(lastFrame()).toContain('Step 1 of 10');
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

    await type(stdin, ANSWERS[0]!);
    await type(stdin, ANSWERS[1]!);
    expect(lastFrame()).toContain('Step 3 of 10');

    stdin.write('\x1b');
    await TICK();

    expect(onDone).toHaveBeenCalledWith(null);
  });
});
