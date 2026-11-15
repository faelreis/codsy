import { EventEmitter } from 'node:events';
import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Home } from '../../src/ui/home-screen';
import type { ResizableStream } from '../../src/ui/use-terminal-width';
import type { ProjectStatus } from '../../src/cli/home';

const TICK = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

async function waitUntil(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

class FakeStream extends EventEmitter implements ResizableStream {
  columns: number | undefined;
  constructor(columns: number | undefined) {
    super();
    this.columns = columns;
  }
}

const NOT_IN_PROJECT: ProjectStatus = {
  inProject: false,
  skillCount: 0,
  schemaCount: 0,
  contextFileCount: 0,
};

const IN_PROJECT: ProjectStatus = {
  inProject: true,
  skillCount: 2,
  schemaCount: 1,
  contextFileCount: 6,
};

describe('Home', () => {
  it('matches its snapshot outside a project', () => {
    const { lastFrame } = render(
      <Home status={NOT_IN_PROJECT} onSelect={() => {}} onCancel={() => {}} />,
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it('matches its snapshot inside a project, including the status line', () => {
    const { lastFrame } = render(
      <Home status={IN_PROJECT} onSelect={() => {}} onCancel={() => {}} />,
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it('omits the status line outside a project', () => {
    const { lastFrame } = render(
      <Home status={NOT_IN_PROJECT} onSelect={() => {}} onCancel={() => {}} />,
    );
    expect(lastFrame()).not.toContain('skills ·');
  });

  it('calls onSelect with the first command when enter is pressed', async () => {
    const onSelect = vi.fn();
    const { lastFrame, stdin } = render(
      <Home status={NOT_IN_PROJECT} onSelect={onSelect} onCancel={() => {}} />,
    );
    expect(lastFrame()).toContain('Start a new project');

    stdin.write('\r');
    await TICK();

    expect(onSelect).toHaveBeenCalledWith('codsy init');
  });

  it('calls onCancel on escape', async () => {
    const onCancel = vi.fn();
    const { stdin } = render(
      <Home status={NOT_IN_PROJECT} onSelect={() => {}} onCancel={onCancel} />,
    );

    stdin.write('\x1b');
    await TICK();

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('hides the mascot under 60 columns', () => {
    const { lastFrame } = render(
      <Home
        status={NOT_IN_PROJECT}
        onSelect={() => {}}
        onCancel={() => {}}
        stream={new FakeStream(50)}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).not.toContain('█');
    expect(frame).not.toContain('▀');
  });

  it('shows the mascot at 60 columns and above', () => {
    const { lastFrame } = render(
      <Home
        status={NOT_IN_PROJECT}
        onSelect={() => {}}
        onCancel={() => {}}
        stream={new FakeStream(60)}
      />,
    );
    expect(lastFrame()).toContain('█');
  });

  it('hides or shows the mascot live when the terminal is resized', async () => {
    const stream = new FakeStream(100);
    const { lastFrame } = render(
      <Home status={NOT_IN_PROJECT} onSelect={() => {}} onCancel={() => {}} stream={stream} />,
    );
    expect(lastFrame()).toContain('█');

    stream.columns = 40;
    stream.emit('resize');
    await waitUntil(() => !(lastFrame() ?? '').includes('█'));

    expect(lastFrame()).not.toContain('█');
  });
});
