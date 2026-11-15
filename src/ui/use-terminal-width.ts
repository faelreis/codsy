import { useEffect, useState } from 'react';

export interface ResizableStream {
  columns: number | undefined;
  on(event: 'resize', listener: () => void): unknown;
  off(event: 'resize', listener: () => void): unknown;
}

const DEFAULT_WIDTH = 80;

export function useTerminalWidth(stream: ResizableStream = process.stdout): number {
  const [width, setWidth] = useState(stream.columns ?? DEFAULT_WIDTH);

  useEffect(() => {
    const handleResize = (): void => setWidth(stream.columns ?? DEFAULT_WIDTH);
    stream.on('resize', handleResize);
    return () => {
      stream.off('resize', handleResize);
    };
  }, [stream]);

  return width;
}
