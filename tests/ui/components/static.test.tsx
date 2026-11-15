import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { FramedPanel, KeyHintFooter, StepIndicator } from '../../../src/ui/components';

describe('StepIndicator', () => {
  it('renders the step count', () => {
    const { lastFrame } = render(<StepIndicator current={2} total={5} />);
    expect(lastFrame()).toContain('Step 2 of 5');
  });

  it('includes an optional label', () => {
    const { lastFrame } = render(<StepIndicator current={1} total={3} label="Company basics" />);
    expect(lastFrame()).toContain('Company basics');
  });
});

describe('KeyHintFooter', () => {
  it('renders the default key hints', () => {
    const { lastFrame } = render(<KeyHintFooter />);
    expect(lastFrame()).toContain('enter select');
  });

  it('renders a custom hint string when provided', () => {
    const { lastFrame } = render(<KeyHintFooter hints="q to quit" />);
    expect(lastFrame()).toBe('q to quit');
  });
});

describe('FramedPanel', () => {
  it('renders a border and an optional title', () => {
    const { lastFrame } = render(
      <FramedPanel title="Summary">
        <Text>Example.</Text>
      </FramedPanel>,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Summary');
    expect(frame).toContain('Example.');
    expect(frame).toContain('─');
  });
});
