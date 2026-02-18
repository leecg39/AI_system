"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
  ReactFlow,
} from "@xyflow/react";
import type { Team } from "@/types/team";

interface TeamOrgChartProps {
  teams: Team[];
  onTeamClick: (teamId: string) => void;
}

const statusColor: Record<string, string> = {
  active: "#2563eb",
  paused: "#f59e0b",
  archived: "#64748b",
};

function getNodeColor(status: string): string {
  return statusColor[status] ?? "#64748b";
}

export function TeamOrgChart({ teams, onTeamClick }: TeamOrgChartProps) {
  const nodes = useMemo<Node[]>(() => {
    const columns = Math.max(Math.ceil(Math.sqrt(teams.length)), 1);
    return teams.map((team, index) => ({
      id: team.id,
      position: {
        x: (index % columns) * 240,
        y: Math.floor(index / columns) * 150,
      },
      data: {
        label: `${team.name}\nAgents ${team.agent_count} · Recent ${team.recent_task_count}`,
      },
      style: {
        width: 200,
        borderRadius: 12,
        border: `2px solid ${getNodeColor(team.status)}`,
        background: "#ffffff",
        color: "#0f172a",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
        fontWeight: 600,
        whiteSpace: "pre-line",
      },
    }));
  }, [teams]);

  const edges = useMemo<Edge[]>(() => {
    return teams.slice(1).map((team) => ({
      id: `edge-${teams[0].id}-${team.id}`,
      source: teams[0].id,
      target: team.id,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#94a3b8",
      },
      style: {
        stroke: "#cbd5e1",
        strokeWidth: 1.5,
      },
    }));
  }, [teams]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    onTeamClick(node.id);
  };

  return (
    <section aria-label="팀 조직도" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">팀 조직도</h2>
        <p className="text-sm text-slate-500">노드 클릭으로 팀 상세 이동</p>
      </div>

      <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
        >
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              const matched = teams.find((team) => team.id === node.id);
              return matched ? getNodeColor(matched.status) : "#64748b";
            }}
          />
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
      </div>

      <div aria-label="팀 빠른 이동" className="flex flex-wrap gap-2">
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => onTeamClick(team.id)}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {team.name}
          </button>
        ))}
      </div>
    </section>
  );
}
