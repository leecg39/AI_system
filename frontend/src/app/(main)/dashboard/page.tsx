"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/services/dashboard";
import { listTeams } from "@/services/teams";
import type { DashboardStats } from "@/types/dashboard";
import type { Team } from "@/types/team";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [statsData, teamsData] = await Promise.all([
          getDashboardStats(),
          listTeams(),
        ]);

        if (!isMounted) {
          return;
        }

        setStats(statsData);
        setTeams(teamsData.teams);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "대시보드를 불러오지 못했습니다.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  const handleCreateTeam = () => {
    router.push("/teams/new");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <h1 className="text-3xl font-black text-foreground">대시보드</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8">
        <h1 className="text-3xl font-black text-foreground">대시보드</h1>
        <div className="border-[3px] border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          {error}
        </div>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-foreground">대시보드</h1>
        <p className="text-muted-foreground">
          AI 에이전트 팀의 현황을 한눈에 확인하세요.
        </p>
      </header>

      {/* Stats Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                진행중 작업
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {stats.running_tasks}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                오늘 완료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {stats.completed_tasks_today}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                전체 팀
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {stats.total_teams}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-foreground">내 팀</h2>
          <Button onClick={handleCreateTeam}>새 팀 만들기</Button>
        </div>

        {teams.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🤖</div>
              <h3 className="text-xl font-bold text-foreground">
                아직 팀이 없습니다
              </h3>
              <p className="text-muted-foreground">
                첫 번째 AI 에이전트 팀을 만들어보세요!
              </p>
              <Button onClick={handleCreateTeam} size="lg">
                새 팀 만들기
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="cursor-pointer transition-all hover:shadow-neo-strong hover:translate-x-[-2px] hover:translate-y-[-2px]"
                onClick={() => handleTeamClick(team.id)}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-black">
                    {team.name}
                  </CardTitle>
                  {team.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {team.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">상태</span>
                    <span
                      className={`font-bold uppercase ${
                        team.status === "active"
                          ? "text-green-600"
                          : team.status === "paused"
                            ? "text-yellow-600"
                            : "text-gray-600"
                      }`}
                    >
                      {team.status === "active"
                        ? "활성"
                        : team.status === "paused"
                          ? "일시정지"
                          : "보관됨"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">에이전트</span>
                    <span className="font-bold">{team.agent_count}개</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">최근 작업</span>
                    <span className="font-bold">{team.recent_task_count}개</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
