import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AntdRegistryWrapper } from './AntdRegistryWrapper';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Kanban Board',
  description: 'A simple drag-and-drop Kanban board',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AntdRegistryWrapper>{children}</AntdRegistryWrapper>
        </AntdRegistry>
      </body>
    </html>
  );
}
