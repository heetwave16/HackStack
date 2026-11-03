'use client';

import { useEffect, useState } from 'react';

export const DEMO_TICK_MS = 100;
export const DEMO_DONE_TICK = 46;

export function useDemoRun(runId: number) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let current = 0;
    setTick(0);
    const id = setInterval(() => {
      current += 1;
      setTick(current);
      if (current >= DEMO_DONE_TICK) clearInterval(id);
    }, DEMO_TICK_MS);
    return () => clearInterval(id);
  }, [runId]);

  return tick;
}
