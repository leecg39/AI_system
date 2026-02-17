"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreateTeamButton } from "@/components/dashboard/CreateTeamButton";
import { StatsSummary } from "@/components/dashboard/StatsSummary";
import { TeamOrgChart } from "@/components/dashboard/TeamOrgChart";
import { getDashboardStats } from "@/services/dashboard";
import { listTeams } from "@/services/teams";
import type { DashboardStats } from "@/types/dashboard";
import type { Team } from "@/types/team";

const INITIAL_STATS: DashboardStats = {
  running_tasks: 0,
  completed_tasks_today: 0,
  total_teams: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [teamsResponse, dashboardStats] = await Promise.all([
        listTeams(),
        getDashboardStats(),
      ]);

      setTeams(teamsResponse.teams);
      setStats(dashboardStats);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "대시보드를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8" data-testid="dashboard-loading">
        <h1 className="text-3xl font-bold text-slate-900">홈</h1>
        <p className="text-slate-600">대시보드를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8" data-testid="dashboard-error">
        <h1 className="text-3xl font-bold text-slate-900">홈</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">대시보드를 불러오지 못했습니다.</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button type="button" onClick={() => void loadDashboard()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">홈</h1>
          <p className="text-slate-600">전체 팀 현황과 오늘의 작업 지표를 확인하세요.</p>
        </div>
        <CreateTeamButton />
      </header>

      <StatsSummary stats={stats} />

      {teams.length === 0 ? (
        <section
          className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-10 text-center"
          data-testid="dashboard-empty"
        >
          <h2 className="text-2xl font-semibold text-slate-900">첫 번째 AI 팀을 만들어보세요</h2>
          <p className="mt-2 text-slate-600">팀을 생성하면 조직도와 작업 현황이 여기에 표시됩니다.</p>
          <div className="mt-6 flex justify-center">
            <CreateTeamButton emphasized />
          </div>
        </section>
      ) : (
        <TeamOrgChart teams={teams} onTeamClick={handleTeamClick} />
      )}
    </div>
  );
}
