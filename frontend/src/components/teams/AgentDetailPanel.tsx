import type { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";

interface AgentDetailPanelProps {
  agent: Agent | null;
  onClose: () => void;
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  if (!agent) {
    return (
      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="에이전트 상세">
        <h2 className="text-lg font-black text-foreground">에이전트 상세</h2>
        <p className="mt-2 text-sm text-muted-foreground">조직도에서 에이전트를 선택하면 상세 정보가 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="border-[3px] border-blue-500 bg-blue-50/40 p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="에이전트 상세">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">{agent.name}</h2>
          <p className="text-sm text-muted-foreground">{agent.role}</p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-foreground">
        <div className="flex justify-between">
          <dt className="font-bold">레이어</dt>
          <dd>{agent.layer}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-bold">모델</dt>
          <dd>{agent.model}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-bold">상태</dt>
          <dd>{agent.status}</dd>
        </div>
      </dl>
    </section>
  );
}
