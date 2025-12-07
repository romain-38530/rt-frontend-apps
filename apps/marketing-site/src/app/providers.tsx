'use client';

import { ToastProvider } from '@rt/ui-components';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider position="top-right">
      {children}
    </ToastProvider>
  );
}
