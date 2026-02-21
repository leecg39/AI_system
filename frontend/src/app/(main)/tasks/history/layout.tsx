import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '작업 이력',
  description: '팀별 작업 히스토리를 조회하고 결과 화면으로 이동할 수 있습니다',
};

export default function TaskHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
