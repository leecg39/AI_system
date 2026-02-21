import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드',
  description: 'AI 에이전트 팀의 현황을 한눈에 확인하세요',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
