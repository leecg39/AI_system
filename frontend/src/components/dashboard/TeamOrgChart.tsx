"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/types/team";
import type { Agent } from "@/types/agent";
import { listAgents } from "@/services/agents";

interface TeamOrgChartProps {
  teams: Team[];
  onTeamClick: (teamId: string) => void;
}

interface TeamWithAgents extends Team {
  agents: Agent[];
}

const layerTag: Record<string, string> = {
  orchestration: "AI 자동화",
  research: "AI 분석",
  execution: "AI 실행",
  quality: "품질 관리",
};

export function TeamOrgChart({ teams, onTeamClick }: TeamOrgChartProps) {
  const [teamsWithAgents, setTeamsWithAgents] = useState<TeamWithAgents[]>([]);

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        teams.map(async (team) => {
          try {
            const res = await listAgents(team.id);
            return { ...team, agents: res.agents };
          } catch {
            return { ...team, agents: [] };
          }
        })
      );
      setTeamsWithAgents(results);
    }
    if (teams.length > 0) void load();
  }, [teams]);

  if (teamsWithAgents.length === 0 && teams.length > 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        조직도를 불러오는 중...
      </div>
    );
  }

  return (
    <section aria-label="팀 조직도" className="space-y-6">
      {/* Whiteboard Container */}
      <div className="relative overflow-x-auto rounded-lg border-[3px] border-foreground bg-white p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        {/* Title */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-foreground">
            직원 {teams.reduce((sum, t) => sum + t.agent_count, 0)}명, 월급 0원
          </h2>
          <p className="mt-1 inline-block border-b-[3px] border-blue-500 pb-1 text-lg font-bold text-blue-600">
            1인 AI 회사의 조직도
          </p>
        </div>

        {/* CEO Node */}
        <div className="flex flex-col items-center">
          <div className="rounded-lg border-[3px] border-foreground bg-white px-8 py-3 text-center shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <p className="text-lg font-black">CEO</p>
            <p className="text-sm text-muted-foreground">(나, AI 통합 관리)</p>
          </div>

          {/* Vertical line from CEO */}
          <div className="h-8 w-[3px] bg-foreground" />

          {/* Horizontal connector line */}
          {teamsWithAgents.length > 1 && (
            <div
              className="h-[3px] bg-foreground"
              style={{
                width: `${Math.min(teamsWithAgents.length * 320, 900)}px`,
              }}
            />
          )}

          {/* Teams Row */}
          <div className="flex flex-wrap justify-center gap-12">
            {teamsWithAgents.map((team) => (
              <div key={team.id} className="flex flex-col items-center">
                {/* Vertical line to team */}
                <div className="h-6 w-[3px] bg-foreground" />

                {/* Team Node */}
                <button
                  type="button"
                  onClick={() => onTeamClick(team.id)}
                  className="group rounded-[50%/40%] border-[3px] border-blue-600 bg-white px-8 py-3 text-center transition-colors hover:bg-blue-50"
                >
                  <p className="text-base font-black text-blue-700">
                    {team.name}
                  </p>
                </button>

                {/* Vertical line to agents */}
                {team.agents.length > 0 && (
                  <div className="h-6 w-[3px] bg-foreground" />
                )}

                {/* Agents Grid - 2 columns like whiteboard */}
                {team.agents.length > 0 && (
                  <div className="relative">
                    {/* Horizontal connector */}
                    {team.agents.length > 1 && (
                      <div className="absolute left-1/2 top-0 h-[3px] w-[calc(100%-60px)] -translate-x-1/2 bg-foreground" />
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-0">
                      {team.agents.map((agent, idx) => (
                        <div
                          key={agent.id}
                          className="flex flex-col items-center"
                        >
                          {/* Vertical line from connector to agent */}
                          <div className="h-5 w-[2px] bg-foreground" />

                          <div className="relative">
                            {/* Agent card */}
                            <div className="min-w-[130px] rounded border-[2.5px] border-foreground bg-white px-4 py-2 text-center shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-colors hover:bg-gray-50">
                              {/* Checkmark */}
                              <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-sm text-red-500">
                                ✓
                              </span>
                              <p className="text-sm font-bold">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {agent.role}
                              </p>
                            </div>

                            {/* Layer tag */}
                            {layerTag[agent.layer] && (
                              <span className="absolute -right-2 -top-3 whitespace-nowrap rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                {layerTag[agent.layer]}
                              </span>
                            )}
                          </div>

                          {/* Arrow to next agent in row */}
                          {idx % 2 === 0 &&
                            idx + 1 < team.agents.length && (
                              <div className="absolute left-1/2 top-[38px] -translate-x-1/2">
                                <span className="text-xs text-foreground">
                                  →
                                </span>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div aria-label="팀 빠른 이동" className="flex flex-wrap gap-2">
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => onTeamClick(team.id)}
            className="rounded-md border-2 border-foreground bg-white px-3 py-1.5 text-sm font-bold transition-colors hover:bg-foreground hover:text-background shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          >
            {team.name}
          </button>
        ))}
      </div>
    </section>
  );
}
