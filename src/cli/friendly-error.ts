export function formatFriendlyError(error: unknown, retryCommand: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return [
    'Codsy ran into a problem and stopped.',
    '',
    `What happened: ${message}`,
    '',
    'How to fix: check the message above, fix the underlying file or configuration, then try again.',
    '',
    `Retry with: ${retryCommand}`,
    '',
  ].join('\n');
}
