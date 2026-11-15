import { render } from 'ink-testing-library';
import type { JSX } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SelectList, TextInput } from '../../../src/ui/components';

const TICK = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

describe('SelectList', () => {
  const items = [
    { label: 'Sales', value: 'sales' },
    { label: 'Support', value: 'support' },
    { label: 'Finance', value: 'finance' },
  ];

  it('highlights the first item initially', () => {
    const { lastFrame } = render(<SelectList items={items} onSelect={() => {}} />);
    expect(lastFrame()).toContain('> Sales');
  });

  it('moves the selection down with j and the down arrow', async () => {
    const { lastFrame, stdin } = render(<SelectList items={items} onSelect={() => {}} />);
    stdin.write('j');
    await TICK();
    expect(lastFrame()).toContain('> Support');
    stdin.write('[B');
    await TICK();
    expect(lastFrame()).toContain('> Finance');
  });

  it('wraps from the last item back to the first with k', async () => {
    const { lastFrame, stdin } = render(<SelectList items={items} onSelect={() => {}} />);
    stdin.write('k');
    await TICK();
    expect(lastFrame()).toContain('> Finance');
  });

  it('calls onSelect with the highlighted value on enter', async () => {
    const onSelect = vi.fn();
    const { stdin } = render(<SelectList items={items} onSelect={onSelect} />);
    stdin.write('j');
    await TICK();
    stdin.write('\r');
    await TICK();
    expect(onSelect).toHaveBeenCalledWith('support');
  });

  it('calls onCancel on escape', async () => {
    const onCancel = vi.fn();
    const { stdin } = render(<SelectList items={items} onSelect={() => {}} onCancel={onCancel} />);
    stdin.write('');
    await TICK();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('toggles the key-hint footer with ?', async () => {
    const { lastFrame, stdin } = render(<SelectList items={items} onSelect={() => {}} />);
    expect(lastFrame()).not.toContain('enter select');
    stdin.write('?');
    await TICK();
    expect(lastFrame()).toContain('enter select');
  });
});

function ControlledTextInput(): JSX.Element {
  const [value, setValue] = useState('');
  return <TextInput value={value} onChange={setValue} placeholder="type here" />;
}

describe('TextInput', () => {
  it('shows the placeholder when empty', () => {
    const { lastFrame } = render(<ControlledTextInput />);
    expect(lastFrame()).toContain('type here');
  });

  it('appends typed characters and supports backspace', async () => {
    const { lastFrame, stdin } = render(<ControlledTextInput />);
    stdin.write('ok');
    await TICK();
    expect(lastFrame()).toContain('ok');
    stdin.write('');
    await TICK();
    expect(lastFrame()).toContain('o');
    expect(lastFrame()).not.toContain('ok');
  });

  it('calls onSubmit with the current value on enter', async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<TextInput value="hello" onChange={() => {}} onSubmit={onSubmit} />);
    stdin.write('\r');
    await TICK();
    expect(onSubmit).toHaveBeenCalledWith('hello');
  });
});
