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
      <div className="border-[3px] border-foreground bg-white p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <h2 className="text-lg font-black text-foreground">최종 확인</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b-[2px] border-dashed border-foreground/20 pb-2">
            <dt className="font-bold text-foreground">템플릿</dt>
            <dd className="font-medium">{template.name}</dd>
          </div>
          <div className="flex justify-between border-b-[2px] border-dashed border-foreground/20 pb-2">
            <dt className="font-bold text-foreground">팀 이름</dt>
            <dd className="font-medium">{teamName}</dd>
          </div>
          <div className="flex justify-between border-b-[2px] border-dashed border-foreground/20 pb-2">
            <dt className="font-bold text-foreground">설명</dt>
            <dd className="font-medium">{description || "없음"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-bold text-foreground">에이전트 수</dt>
            <dd className="font-black text-blue-600">{agents.length}명</dd>
          </div>
        </dl>
      </div>

      <div className="border-[3px] border-foreground bg-white p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <h3 className="text-base font-black text-foreground">에이전트 목록</h3>
        <ul className="mt-3 space-y-2">
          {agents.map((agent, index) => (
            <li
              key={agent.id}
              className="flex items-center gap-3 border-[2px] border-foreground bg-white px-4 py-2.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                {index + 1}
              </span>
              <span className="text-sm font-bold text-foreground">{agent.name}</span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{agent.role}</span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="inline-block border-[1.5px] border-blue-400 bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600">
                {agent.layer}
              </span>
              <span className="inline-block border-[1.5px] border-purple-400 bg-purple-50 px-1.5 py-0.5 text-[11px] font-bold text-purple-600">
                {agent.model}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-[2px] border-foreground font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          ← 이전
        </Button>
        <Button
          type="button"
          onClick={onCreate}
          disabled={isSubmitting}
          className="border-[2px] border-foreground bg-green-500 px-8 font-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-green-600 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          {isSubmitting ? "생성 중..." : "팀 생성 🚀"}
        </Button>
      </div>
    </section>
  );
}
