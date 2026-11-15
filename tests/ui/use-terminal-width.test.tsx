import { EventEmitter } from 'node:events';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import type { JSX } from 'react';
import { describe, expect, it } from 'vitest';
import { useTerminalWidth, type ResizableStream } from '../../src/ui/use-terminal-width';

const TICK = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 10));

class FakeStream extends EventEmitter implements ResizableStream {
  columns: number | undefined;
  constructor(columns: number | undefined) {
    super();
    this.columns = columns;
  }
}

function WidthProbe({ stream }: { stream: ResizableStream }): JSX.Element {
  const width = useTerminalWidth(stream);
  return <Text>width={width}</Text>;
}

describe('useTerminalWidth', () => {
  it('reads the initial column count from the given stream', () => {
    const { lastFrame } = render(<WidthProbe stream={new FakeStream(120)} />);
    expect(lastFrame()).toBe('width=120');
  });

  it('falls back to 80 when the stream reports no columns', () => {
    const { lastFrame } = render(<WidthProbe stream={new FakeStream(undefined)} />);
    expect(lastFrame()).toBe('width=80');
  });

  it('updates live when the stream emits a resize event', async () => {
    const stream = new FakeStream(100);
    const { lastFrame } = render(<WidthProbe stream={stream} />);
    expect(lastFrame()).toBe('width=100');

    stream.columns = 50;
    stream.emit('resize');
    await TICK();

    expect(lastFrame()).toBe('width=50');
  });

  it('stops listening after the component unmounts', () => {
    const stream = new FakeStream(100);
    const { unmount } = render(<WidthProbe stream={stream} />);
    unmount();

    expect(stream.listenerCount('resize')).toBe(0);
  });
});
