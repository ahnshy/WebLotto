'use client';

import * as React from 'react';

export default function AutoPrint() {
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
