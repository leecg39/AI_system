// @TASK P0-T0.2 - Frontend 초기화: Root Layout
// @SPEC docs/planning/01-project-overview.md

import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

export const metadata: Metadata = {
  title: {
    template: 'AI Agent Team | %s',
    default: 'AI Agent Team Platform',
  },
  description: 'AI 에이전트 팀을 관리하고 작업을 자동화하는 플랫폼',
  keywords: ['AI', '에이전트', '팀 관리', '작업 자동화', 'OpenAI', 'Claude'],
  authors: [{ name: 'AI Agent Team' }],
  creator: 'AI Agent Team',
  publisher: 'AI Agent Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'AI Agent Team Platform',
    description: 'AI 에이전트 팀을 관리하고 작업을 자동화하는 플랫폼',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'AI Agent Team',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={spaceGrotesk.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
