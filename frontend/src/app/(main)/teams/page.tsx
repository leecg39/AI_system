// @TASK P0-T0.2 - Frontend 초기화: Teams Page Placeholder

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '팀 관리',
  description: 'AI 에이전트 팀을 생성하고 관리합니다',
};

export default function TeamsPage() {
  return (
    <div className="space-y-4 py-8">
      <h1 className="text-3xl font-black text-foreground">팀 관리</h1>
      <p className="text-muted-foreground">팀 관리 기능은 Phase 2에서 구현됩니다</p>
    </div>
  );
}
