"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmSummary } from "@/components/teams/create/ConfirmSummary";
import { CustomizeForm } from "@/components/teams/create/CustomizeForm";
import { StepIndicator } from "@/components/teams/create/StepIndicator";
import { TemplateGrid } from "@/components/teams/create/TemplateGrid";
import { createAgent } from "@/services/agents";
import { listTemplates } from "@/services/templates";
import { createTeam } from "@/services/teams";
import type { AgentDraft } from "@/types/team-create";
import type { TeamTemplate } from "@/types/template";

type Step = 1 | 2 | 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(source: Record<string, unknown>, key: string, fallback: string): string {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toAgentDrafts(template: TeamTemplate): AgentDraft[] {
  if (!Array.isArray(template.default_agents)) {
    return [];
  }

  return template.default_agents.map((entry, index) => {
    if (!isRecord(entry)) {
      return {
        id: `agent-${index}-${randomId()}`,
        name: `agent_${index + 1}`,
        role: "Worker",
        layer: "execution",
        model: "sonnet",
        prompt_template: "",
      };
    }

    return {
      id: `agent-${index}-${randomId()}`,
      name: readString(entry, "name", `agent_${index + 1}`),
      role: readString(entry, "role", "Worker"),
      layer: readString(entry, "layer", "execution"),
      model: readString(entry, "model", "sonnet"),
      prompt_template: readString(entry, "prompt_template", ""),
    };
  });
}

export default function TeamCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [templates, setTemplates] = useState<TeamTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [agents, setAgents] = useState<AgentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listTemplates();
        if (!isMounted) {
          return;
        }
        setTemplates(response.templates);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        const message =
          fetchError instanceof Error ? fetchError.message : "템플릿을 불러오지 못했습니다.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const canProceedToConfirm =
    teamName.trim().length > 0 &&
    agents.length > 0 &&
    agents.every((agent) => agent.name.trim().length > 0 && agent.role.trim().length > 0);

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setSelectedTemplateId(templateId);
    setTeamName(template.name);
    setDescription(template.description ?? "");
    setAgents(toAgentDrafts(template));
    setError(null);
    setStep(2);
  };

  const handleAddAgent = () => {
    setAgents((current) => [
      ...current,
      {
        id: `agent-new-${randomId()}`,
        name: "",
        role: "",
        layer: "execution",
        model: "sonnet",
        prompt_template: "",
      },
    ]);
  };

  const handleRemoveAgent = (agentId: string) => {
    setAgents((current) => current.filter((agent) => agent.id !== agentId));
  };

  const handleChangeAgent = (agentId: string, key: keyof AgentDraft, value: string) => {
    setAgents((current) =>
      current.map((agent) => (agent.id === agentId ? { ...agent, [key]: value } : agent)),
    );
  };

  const handleCreateTeam = async () => {
    if (!selectedTemplate || isSubmitting || !canProceedToConfirm) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const team = await createTeam({
        name: teamName.trim(),
        description: description.trim() || undefined,
        template_id: selectedTemplate.id,
        config: {
          category: selectedTemplate.category,
        },
      });

      for (const [index, agent] of agents.entries()) {
        await createAgent(team.id, {
          name: agent.name.trim(),
          role: agent.role.trim(),
          layer: agent.layer,
          model: agent.model,
          prompt_template: agent.prompt_template || undefined,
          tools: [],
          sort_order: index,
        });
      }

      router.push("/dashboard");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "팀 생성에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-8" data-testid="team-create-loading">
        <h1 className="text-3xl font-bold text-slate-900">팀 생성</h1>
        <p className="text-slate-600">템플릿을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">팀 생성</h1>
        <p className="text-slate-600">템플릿을 선택하고 팀 구성원을 커스터마이즈해 팀을 생성하세요.</p>
      </header>

      <StepIndicator currentStep={step} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {step === 1 ? (
        <TemplateGrid
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelect={handleSelectTemplate}
        />
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <CustomizeForm
            teamName={teamName}
            description={description}
            agents={agents}
            onTeamNameChange={setTeamName}
            onDescriptionChange={setDescription}
            onAddAgent={handleAddAgent}
            onRemoveAgent={handleRemoveAgent}
            onChangeAgent={handleChangeAgent}
            onNext={() => setStep(3)}
            canProceed={canProceedToConfirm}
          />
          <div className="flex justify-start">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              템플릿 다시 선택
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && selectedTemplate ? (
        <ConfirmSummary
          template={selectedTemplate}
          teamName={teamName.trim()}
          description={description.trim()}
          agents={agents}
          isSubmitting={isSubmitting}
          onBack={() => setStep(2)}
          onCreate={() => void handleCreateTeam()}
        />
      ) : null}
    </div>
  );
}
