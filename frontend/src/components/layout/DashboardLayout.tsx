// @TASK P1-S0-T1 - 공통 대시보드 레이아웃
// @SPEC docs/planning/03-user-flow.md#대시보드

'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* 데스크톱 사이드바 */}
      <Sidebar />

      {/* 모바일 사이드바 */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />

      {/* 메인 영역 */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* 헤더 */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
