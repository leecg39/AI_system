"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAgents } from "@/services/agents";
import { createTask } from "@/services/tasks";
import { getTeamById } from "@/services/teams";
import type { Agent } from "@/types/agent";
import type { Team } from "@/types/team";

type Step = 1 | 2 | 3;

interface TaskRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface TaskTypeOption {
  value: string;
  label: string;
  description: string;
}

interface OutputOption {
  value: string;
  label: string;
}

interface TaskPreset {
  taskTypes: TaskTypeOption[];
  outputs: OutputOption[];
}

const STEP_ITEMS = [
  { id: 1 as Step, label: "옵션 선택" },
  { id: 2 as Step, label: "입력" },
  { id: 3 as Step, label: "확인" },
];

const CATEGORY_ALIASES: Record<string, string> = {
  marketing: "marketing",
  "마케팅": "marketing",
  finance: "finance",
  "재무": "finance",
  strategy: "strategy",
  "전략": "strategy",
};

const PRESETS: Record<string, TaskPreset> = {
  marketing: {
    taskTypes: [
      { value: "content", label: "콘텐츠 작성", description: "블로그/SNS/뉴스레터 콘텐츠를 생성합니다." },
      { value: "campaign", label: "캠페인 기획", description: "캠페인 메시지와 실행안을 구성합니다." },
      { value: "review", label: "브랜드 점검", description: "기존 문안을 브랜드 톤으로 점검합니다." },
    ],
    outputs: [
      { value: "blog", label: "블로그" },
      { value: "sns", label: "SNS 포스트" },
      { value: "newsletter", label: "뉴스레터" },
    ],
  },
  finance: {
    taskTypes: [
      { value: "analysis", label: "재무 분석", description: "지표 기반 재무 분석 리포트를 작성합니다." },
      { value: "forecast", label: "예측 시나리오", description: "가정 기반 예측 시나리오를 생성합니다." },
      { value: "summary", label: "요약 보고", description: "핵심 수치와 인사이트를 요약합니다." },
    ],
    outputs: [
      { value: "report", label: "리포트" },
      { value: "table", label: "표 요약" },
      { value: "brief", label: "핵심 브리프" },
    ],
  },
  strategy: {
    taskTypes: [
      { value: "research", label: "시장 리서치", description: "시장/경쟁 상황을 조사합니다." },
      { value: "plan", label: "전략 제안", description: "실행 가능한 전략안을 제시합니다." },
      { value: "risk", label: "리스크 분석", description: "리스크 요인과 대응안을 정리합니다." },
    ],
    outputs: [
      { value: "strategy-doc", label: "전략 문서" },
      { value: "slides", label: "슬라이드" },
      { value: "checklist", label: "실행 체크리스트" },
    ],
  },
  default: {
    taskTypes: [
      { value: "analysis", label: "분석", description: "주어진 입력을 분석해 결과를 생성합니다." },
      { value: "content", label: "콘텐츠", description: "입력 기반 콘텐츠를 생성합니다." },
      { value: "report", label: "보고서", description: "결과를 보고서 형식으로 정리합니다." },
    ],
    outputs: [
      { value: "text", label: "텍스트" },
      { value: "summary", label: "요약" },
      { value: "outline", label: "아웃라인" },
    ],
  },
};

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

function resolveTeamCategory(team: Team | null): string {
  if (!team) {
    return "default";
  }

  const value = team.config["category"];
  if (typeof value !== "string") {
    return "default";
  }

  const normalized = value.trim().toLowerCase();
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

export default function TaskRequestPage({ params }: TaskRequestPageProps) {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [taskType, setTaskType] = useState("");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>([]);
  const [executionMode, setExecutionMode] = useState<"sequential" | "parallel">("sequential");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
          setError("팀 경로 정보를 확인하지 못했습니다.");
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [params]);

  const loadData = useCallback(async () => {
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
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "작업 요청 화면 데이터를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      void loadData();
    }
  }, [teamId, loadData]);

  const category = useMemo(() => resolveTeamCategory(team), [team]);
  const preset = PRESETS[category] ?? PRESETS.default;

  useEffect(() => {
    if (!preset.taskTypes.some((option) => option.value === taskType) && preset.taskTypes.length > 0) {
      setTaskType(preset.taskTypes[0].value);
    }

    setSelectedOutputs((current) => {
      const allowed = new Set(preset.outputs.map((output) => output.value));
      const filtered = current.filter((value) => allowed.has(value));

      if (filtered.length > 0 && filtered.length === current.length) {
        return current;
      }

      if (filtered.length > 0) {
        return filtered;
      }

      if (preset.outputs.length > 0) {
        return [preset.outputs[0].value];
      }

      return [];
    });
  }, [preset, taskType]);

  const outputLabelMap = useMemo(() => {
    return new Map(preset.outputs.map((output) => [output.value, output.label]));
  }, [preset.outputs]);

  const selectedOutputLabels = useMemo(() => {
    return selectedOutputs.map((value) => outputLabelMap.get(value) ?? value);
  }, [outputLabelMap, selectedOutputs]);

  const normalizedUrl = sourceUrl.trim();
  const urlIsValid = normalizedUrl.length === 0 || isValidHttpUrl(normalizedUrl);
  const hasInputPayload = normalizedUrl.length > 0 || sourceText.trim().length > 0 || uploadedFile !== null;
  const canProceedStep1 = taskType.length > 0 && selectedOutputs.length > 0;
  const canProceedStep2 = hasInputPayload && urlIsValid;

  const selectedTaskTypeLabel =
    preset.taskTypes.find((option) => option.value === taskType)?.label ?? taskType;

  const handleStepClick = (target: Step) => {
    if (target <= step) {
      setStep(target);
      setError(null);
    }
  };

  const handleToggleOutput = (value: string) => {
    setSelectedOutputs((current) => {
      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }
      return [...current, value];
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setUploadedFile(nextFile);
  };

  const handleExecute = async () => {
    if (isSubmitting) {
      return;
    }
    if (!canProceedStep2) {
      setError("URL 형식 또는 입력 데이터를 확인해주세요.");
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: Record<string, unknown> = {};
    if (normalizedUrl.length > 0) {
      input.url = normalizedUrl;
    }
    if (sourceText.trim().length > 0) {
      input.text = sourceText.trim();
    }
    if (uploadedFile) {
      input.file = {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
      };
    }
    if (additionalInstructions.trim().length > 0) {
      input.instructions = additionalInstructions.trim();
    }

    const options: Record<string, unknown> = {
      outputs: selectedOutputs,
      execution_mode: executionMode,
      team_category: category,
      agent_ids: agents.map((agent) => agent.id),
    };

    try {
      if (!teamId) {
        throw new Error("Team id is not resolved");
      }

      const createdTask = await createTask(teamId, {
        type: taskType,
        input,
        options,
      });
      router.push(`/tasks/${createdTask.id}/monitor`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "작업 실행에 실패했습니다.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-8" data-testid="task-request-loading">
        <h1 className="text-3xl font-bold text-slate-900">작업 요청</h1>
        <p className="text-slate-600">팀 설정과 에이전트 구성을 불러오는 중...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-4 py-8" data-testid="task-request-error">
        <h1 className="text-3xl font-bold text-slate-900">작업 요청</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">팀 정보를 찾을 수 없습니다.</p>
          <p className="text-sm">다시 시도해 주세요.</p>
        </div>
        <Button type="button" onClick={() => void loadData()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4" data-testid="task-request-page">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">작업 요청</h1>
        <p className="text-slate-600">{team.name} 팀의 에이전트 {agents.length}명에게 작업을 요청합니다.</p>
      </header>

      <section
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        aria-label="참여 에이전트"
        data-testid="task-request-agents"
      >
        <h2 className="text-sm font-semibold text-slate-900">참여 에이전트</h2>
        {agents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">연결된 에이전트가 없습니다.</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {agents.map((agent) => (
              <li key={agent.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium text-slate-900">{agent.name}</span>
                <span className="ml-2 text-xs text-slate-500">{agent.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ol className="grid gap-3 sm:grid-cols-3" aria-label="작업 요청 단계">
        {STEP_ITEMS.map((item) => {
          const isCurrent = item.id === step;
          const isDone = item.id < step;

          return (
            <li key={item.id}>
              <button
                type="button"
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium ${
                  isCurrent
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : isDone
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500"
                }`}
                onClick={() => handleStepClick(item.id)}
                disabled={item.id > step}
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                  {item.id}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="옵션 선택">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">1단계: 옵션 선택</h2>
            <p className="mt-1 text-sm text-slate-600">작업 유형과 원하는 결과 포맷을 선택하세요.</p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-slate-700">작업 유형</legend>
            <div className="grid gap-3 md:grid-cols-3">
              {preset.taskTypes.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg border p-4 ${
                    taskType === option.value
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="task-type"
                    value={option.value}
                    checked={taskType === option.value}
                    onChange={() => setTaskType(option.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-600">{option.description}</p>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-slate-700">결과 포맷</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {preset.outputs.map((output) => (
                <label
                  key={output.value}
                  className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedOutputs.includes(output.value)}
                    onChange={() => handleToggleOutput(output.value)}
                  />
                  <span>{output.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="execution-mode" className="text-sm font-medium text-slate-700">
              실행 모드
            </label>
            <select
              id="execution-mode"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={executionMode}
              onChange={(event) => setExecutionMode(event.target.value as "sequential" | "parallel")}
            >
              <option value="sequential">순차 실행</option>
              <option value="parallel">레이어별 병렬 실행</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)} disabled={!canProceedStep1}>
              입력 단계로 이동
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="입력">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">2단계: 입력</h2>
            <p className="mt-1 text-sm text-slate-600">URL, 텍스트, 파일 중 하나 이상을 제공하세요.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="source-url" className="text-sm font-medium text-slate-700">
              소스 URL
            </label>
            <Input
              id="source-url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://example.com/article"
            />
            {!urlIsValid ? (
              <p className="text-xs text-red-600">http/https URL 형식으로 입력해 주세요.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="source-text" className="text-sm font-medium text-slate-700">
              입력 텍스트
            </label>
            <textarea
              id="source-text"
              className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="요청에 필요한 핵심 내용을 입력하세요."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="source-file" className="text-sm font-medium text-slate-700">
              파일 업로드
            </label>
            <Input id="source-file" type="file" accept=".pdf,.txt,.md,.doc,.docx" onChange={handleFileChange} />
            {uploadedFile ? (
              <p className="text-xs text-slate-600">
                {uploadedFile.name} · {formatFileSize(uploadedFile.size)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium text-slate-700">
              세부 요청사항
            </label>
            <textarea
              id="instructions"
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={additionalInstructions}
              onChange={(event) => setAdditionalInstructions(event.target.value)}
              placeholder="톤앤매너, 금지어, 목표 독자 등을 입력하세요."
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              이전
            </Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!canProceedStep2}>
              확인 단계로 이동
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="확인">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">3단계: 실행 전 확인</h2>
            <p className="mt-1 text-sm text-slate-600">선택한 옵션과 입력 데이터를 확인한 뒤 작업을 실행하세요.</p>
          </div>

          <dl className="grid gap-2 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="font-medium">팀</dt>
              <dd>{team.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">작업 유형</dt>
              <dd>{selectedTaskTypeLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">결과 포맷</dt>
              <dd>{selectedOutputLabels.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">실행 모드</dt>
              <dd>{executionMode === "parallel" ? "레이어별 병렬 실행" : "순차 실행"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">URL</dt>
              <dd className="max-w-[70%] truncate text-right">{normalizedUrl || "없음"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">텍스트 길이</dt>
              <dd>{sourceText.trim().length > 0 ? `${sourceText.trim().length}자` : "없음"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">파일</dt>
              <dd>{uploadedFile ? `${uploadedFile.name} (${formatFileSize(uploadedFile.size)})` : "없음"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium">세부 요청사항</dt>
              <dd className="max-w-[70%] text-right">{additionalInstructions.trim() || "없음"}</dd>
            </div>
          </dl>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
              이전
            </Button>
            <Button type="button" onClick={() => void handleExecute()} disabled={isSubmitting}>
              {isSubmitting ? "실행 중..." : "작업 실행"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
