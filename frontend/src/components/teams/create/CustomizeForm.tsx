import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AgentDraft } from "@/types/team-create";

interface CustomizeFormProps {
  teamName: string;
  description: string;
  agents: AgentDraft[];
  onTeamNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAddAgent: () => void;
  onRemoveAgent: (agentId: string) => void;
  onChangeAgent: (agentId: string, key: keyof AgentDraft, value: string) => void;
  onNext: () => void;
  canProceed: boolean;
}

const layerOptions = ["orchestration", "research", "execution", "quality"];
const modelOptions = ["opus", "sonnet", "haiku"];

export function CustomizeForm({
  teamName,
  description,
  agents,
  onTeamNameChange,
  onDescriptionChange,
  onAddAgent,
  onRemoveAgent,
  onChangeAgent,
  onNext,
  canProceed,
}: CustomizeFormProps) {
  return (
    <section aria-label="커스터마이즈" className="space-y-5">
      <div className="border-[3px] border-foreground bg-white p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <h2 className="mb-4 text-lg font-black text-foreground">팀 정보</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team-name" className="font-bold">팀 이름</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
              className="border-[2px] border-foreground font-medium focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-description" className="font-bold">팀 설명</Label>
            <Input
              id="team-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="border-[2px] border-foreground font-medium focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">에이전트 설정</h2>
          <Button
            type="button"
            variant="outline"
            onClick={onAddAgent}
            className="border-[2px] border-foreground font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            + 에이전트 추가
          </Button>
        </div>

        <div className="space-y-3">
          {agents.map((agent, index) => (
            <article
              key={agent.id}
              className="border-[3px] border-foreground bg-white p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                  {index + 1}
                </span>
                <span className="text-sm font-black text-foreground">{agent.name || "새 에이전트"}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <Input
                  aria-label={`에이전트 이름 ${agent.name}`}
                  value={agent.name}
                  onChange={(e) => onChangeAgent(agent.id, "name", e.target.value)}
                  placeholder="이름"
                  className="border-[2px] border-foreground font-medium"
                />
                <Input
                  aria-label={`에이전트 역할 ${agent.name}`}
                  value={agent.role}
                  onChange={(e) => onChangeAgent(agent.id, "role", e.target.value)}
                  placeholder="역할"
                  className="border-[2px] border-foreground font-medium"
                />

                <select
                  aria-label={`에이전트 레이어 ${agent.name}`}
                  className="h-10 border-[2px] border-foreground bg-white px-3 text-sm font-medium"
                  value={agent.layer}
                  onChange={(e) => onChangeAgent(agent.id, "layer", e.target.value)}
                >
                  {layerOptions.map((layer) => (
                    <option key={layer} value={layer}>
                      {layer}
                    </option>
                  ))}
                </select>

                <select
                  aria-label={`에이전트 모델 ${agent.name}`}
                  className="h-10 border-[2px] border-foreground bg-white px-3 text-sm font-medium"
                  value={agent.model}
                  onChange={(e) => onChangeAgent(agent.id, "model", e.target.value)}
                >
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>

                <Input
                  aria-label={`에이전트 프롬프트 ${agent.name}`}
                  value={agent.prompt_template}
                  onChange={(e) => onChangeAgent(agent.id, "prompt_template", e.target.value)}
                  placeholder="프롬프트"
                  className="border-[2px] border-foreground font-medium"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRemoveAgent(agent.id)}
                    className="border-[2px] border-red-500 font-bold text-red-600 hover:bg-red-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="border-[2px] border-foreground bg-foreground px-8 font-black text-background shadow-[4px_4px_0_0_rgba(59,130,246,1)] hover:shadow-[2px_2px_0_0_rgba(59,130,246,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          확인 단계로 이동 →
        </Button>
      </div>
    </section>
  );
}
