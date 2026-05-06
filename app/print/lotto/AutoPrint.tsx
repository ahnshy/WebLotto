'use client';

import * as React from 'react';

export default function AutoPrint({ delayMs = 300 }: { delayMs?: number }) {
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return null;
}
