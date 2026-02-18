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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="team-name">팀 이름</Label>
          <Input id="team-name" value={teamName} onChange={(e) => onTeamNameChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-description">팀 설명</Label>
          <Input
            id="team-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">에이전트 설정</h2>
          <Button type="button" variant="outline" onClick={onAddAgent}>
            에이전트 추가
          </Button>
        </div>

        <div className="space-y-3">
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <Input
                  aria-label={`에이전트 이름 ${agent.name}`}
                  value={agent.name}
                  onChange={(e) => onChangeAgent(agent.id, "name", e.target.value)}
                  placeholder="이름"
                />
                <Input
                  aria-label={`에이전트 역할 ${agent.name}`}
                  value={agent.role}
                  onChange={(e) => onChangeAgent(agent.id, "role", e.target.value)}
                  placeholder="역할"
                />

                <select
                  aria-label={`에이전트 레이어 ${agent.name}`}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onRemoveAgent(agent.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext} disabled={!canProceed}>
          확인 단계로 이동
        </Button>
      </div>
    </section>
  );
}
