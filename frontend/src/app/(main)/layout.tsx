// @TASK P1-S0-T1 - 공통 대시보드 레이아웃: Main Layout
// @SPEC docs/planning/03-user-flow.md#대시보드

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
