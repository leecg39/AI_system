"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  MarkerType,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { Agent } from "@/types/agent";

interface AgentOrgChartProps {
  agents: Agent[];
  onSelectAgent: (agentId: string) => void;
}

const layerColor: Record<string, string> = {
  orchestration: "#2563eb",
  research: "#0ea5e9",
  execution: "#14b8a6",
  quality: "#f59e0b",
};

function getLayerColor(layer: string): string {
  return layerColor[layer] ?? "#64748b";
}

export function AgentOrgChart({ agents, onSelectAgent }: AgentOrgChartProps) {
  const nodes = useMemo<Node[]>(() => {
    const layers = ["orchestration", "research", "execution", "quality"];

    return agents.map((agent, index) => {
      const layerIndex = Math.max(layers.indexOf(agent.layer), 0);
      const sameLayerAgents = agents.filter((item) => item.layer === agent.layer);
      const indexInLayer = sameLayerAgents.findIndex((item) => item.id === agent.id);

      return {
        id: agent.id,
        position: {
          x: indexInLayer * 230,
          y: layerIndex * 140,
        },
        data: {
          label: `${agent.name}\n${agent.role}`,
        },
        style: {
          width: 200,
          borderRadius: 12,
          border: `2px solid ${getLayerColor(agent.layer)}`,
          background: "#ffffff",
          color: "#0f172a",
          whiteSpace: "pre-line",
          fontWeight: 600,
        },
      };
    });
  }, [agents]);

  const edges = useMemo<Edge[]>(() => {
    if (agents.length < 2) {
      return [];
    }

    const orchestration = agents.filter((agent) => agent.layer === "orchestration");
    const nonOrchestration = agents.filter((agent) => agent.layer !== "orchestration");

    if (orchestration.length === 0) {
      return nonOrchestration.slice(1).map((agent) => ({
        id: `edge-${nonOrchestration[0].id}-${agent.id}`,
        source: nonOrchestration[0].id,
        target: agent.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
      }));
    }

    return nonOrchestration.map((agent) => ({
      id: `edge-${orchestration[0].id}-${agent.id}`,
      source: orchestration[0].id,
      target: agent.id,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
    }));
  }, [agents]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    onSelectAgent(node.id);
  };

  return (
    <section className="space-y-3" aria-label="에이전트 조직도">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">에이전트 조직도</h2>
        <p className="text-sm text-slate-500">노드를 클릭하면 상세를 볼 수 있습니다.</p>
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
        >
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="에이전트 빠른 선택">
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {agent.name}
          </button>
        ))}
      </div>
    </section>
  );
}
