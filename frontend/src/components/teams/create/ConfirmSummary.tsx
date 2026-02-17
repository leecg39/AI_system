import { Button } from "@/components/ui/button";
import type { TeamTemplate } from "@/types/template";
import type { AgentDraft } from "@/types/team-create";

interface ConfirmSummaryProps {
  template: TeamTemplate;
  teamName: string;
  description: string;
  agents: AgentDraft[];
  isSubmitting: boolean;
  onBack: () => void;
  onCreate: () => void;
}

export function ConfirmSummary({
  template,
  teamName,
  description,
  agents,
  isSubmitting,
  onBack,
  onCreate,
}: ConfirmSummaryProps) {
  return (
    <section aria-label="팀 생성 확인" className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">최종 확인</h2>

        <dl className="mt-4 grid gap-2 text-sm text-slate-700">
          <div className="flex justify-between">
            <dt className="font-medium">템플릿</dt>
            <dd>{template.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">팀 이름</dt>
            <dd>{teamName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">설명</dt>
            <dd>{description || "없음"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">에이전트 수</dt>
            <dd>{agents.length}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">에이전트 목록</h3>
        <ul className="mt-3 space-y-2">
          {agents.map((agent) => (
            <li key={agent.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
              {agent.name} · {agent.role} · {agent.layer} · {agent.model}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          이전
        </Button>
        <Button type="button" onClick={onCreate} disabled={isSubmitting}>
          {isSubmitting ? "생성 중..." : "팀 생성"}
        </Button>
      </div>
    </section>
  );
}
