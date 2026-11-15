import type { JSX } from 'react';
import { Box, render, Text } from 'ink';
import type { ProjectStatus } from '../cli/home';
import { HOME_MENU_ITEMS, statusLine } from '../cli/home';
import { detectCapabilitiesFromProcess } from './capabilities';
import { IdleMascot } from './components/IdleMascot';
import { SelectList } from './components/SelectList';
import { useTerminalWidth, type ResizableStream } from './use-terminal-width';

const ONE_LINE_DESCRIPTION =
  'Codsy helps you write operational knowledge as versioned files people and AI agents can both read.';
const MASCOT_MIN_WIDTH = 60;

interface HomeProps {
  status: ProjectStatus;
  onSelect: (command: string) => void;
  onCancel: () => void;
  stream?: ResizableStream;
  motionEnabled?: boolean;
}

export function Home({
  status,
  onSelect,
  onCancel,
  stream,
  motionEnabled = true,
}: HomeProps): JSX.Element {
  const width = useTerminalWidth(stream);
  const items = HOME_MENU_ITEMS.map((item) => ({ label: item.label, value: item.command }));

  return (
    <Box flexDirection="column">
      {width >= MASCOT_MIN_WIDTH && (
        <Box marginBottom={1}>
          <IdleMascot motionEnabled={motionEnabled} />
        </Box>
      )}
      <Text>{ONE_LINE_DESCRIPTION}</Text>
      {status.inProject && <Text>{statusLine(status)}</Text>}
      <SelectList items={items} onSelect={onSelect} onCancel={onCancel} />
    </Box>
  );
}

export async function renderHomeScreen(status: ProjectStatus): Promise<void> {
  const capabilities = detectCapabilitiesFromProcess({
    plainFlag: false,
    noMotionFlag: false,
    format: undefined,
  });

  return new Promise((resolve) => {
    const instance = render(
      <Home
        status={status}
        motionEnabled={capabilities.motionEnabled}
        onSelect={(command) => {
          instance.unmount();
          process.stdout.write(`Run: ${command}\n`);
          resolve();
        }}
        onCancel={() => {
          instance.unmount();
          resolve();
        }}
      />,
    );
  });
}
