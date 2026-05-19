'use client';

import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';

export function AntdRegistryWrapper({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: 'var(--clr-primary)',
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
