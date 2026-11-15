import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { IdleMascot } from '../../../src/ui/components';

const WAIT = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('IdleMascot', () => {
  it('renders the full-size mascot and never changes when motion is disabled', async () => {
    const { lastFrame } = render(<IdleMascot motionEnabled={false} />);
    const first = lastFrame();
    await WAIT(600);
    expect(lastFrame()).toBe(first);
    expect(first).toContain('█');
  });

  it('cycles through idle frames when motion is enabled', async () => {
    const { lastFrame } = render(<IdleMascot motionEnabled={true} />);
    const first = lastFrame();
    await WAIT(600);
    expect(lastFrame()).not.toBe(first);
  });

  it('never changes the number of lines across idle frames', async () => {
    const { lastFrame } = render(<IdleMascot motionEnabled={true} />);
    const firstLineCount = (lastFrame() ?? '').split('\n').length;
    await WAIT(600);
    expect((lastFrame() ?? '').split('\n')).toHaveLength(firstLineCount);
  });
});
