import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '설정',
  description: '프로필, API 키, 구독, 알림, 데이터 관리 설정을 조정합니다',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
