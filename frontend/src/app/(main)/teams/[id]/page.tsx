"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentDetailPanel } from "@/components/teams/AgentDetailPanel";
import { AgentOrgChart } from "@/components/teams/AgentOrgChart";
import { NewTaskButton } from "@/components/teams/NewTaskButton";
import { RecentTasksList } from "@/components/teams/RecentTasksList";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { listAgents } from "@/services/agents";
import { getTeamById } from "@/services/teams";
import type { Agent } from "@/types/agent";
import type { Team } from "@/types/team";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void params
      .then((resolvedParams) => {
        if (isActive) {
          setTeamId(resolvedParams.id);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("팀 정보를 불러오기 위한 경로 파라미터를 확인하지 못했습니다.");
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [params]);

  const loadTeamDetail = useCallback(async () => {
    if (!teamId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [teamResponse, agentsResponse] = await Promise.all([
        getTeamById(teamId),
        listAgents(teamId),
      ]);
      setTeam(teamResponse);
      setAgents(agentsResponse.agents);

      if (agentsResponse.agents.length > 0) {
        setSelectedAgentId(agentsResponse.agents[0].id);
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "팀 상세 정보를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      void loadTeamDetail();
    }
  }, [teamId, loadTeamDetail]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) {
      return null;
    }
    return agents.find((agent) => agent.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);

  if (isLoading) {
    return (
      <div className="space-y-3 py-8" data-testid="team-detail-loading">
        <h1 className="text-3xl font-black text-foreground">팀 상세</h1>
        <p className="text-muted-foreground">팀 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-4 py-8" data-testid="team-detail-error">
        <h1 className="text-3xl font-black text-foreground">팀 상세</h1>
        <div className="border-[3px] border-red-500 bg-red-50 p-4 text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <p className="font-bold">팀 정보를 불러오지 못했습니다.</p>
          <p className="text-sm">{error || "알 수 없는 오류가 발생했습니다."}</p>
        </div>
        <Button type="button" onClick={() => void loadTeamDetail()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <TeamHeader team={team} />

      <NewTaskButton teamId={team.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentOrgChart agents={agents} onSelectAgent={setSelectedAgentId} />
        </div>
        <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedAgentId(null)} />
      </div>

      <RecentTasksList />
    </div>
  );
}
