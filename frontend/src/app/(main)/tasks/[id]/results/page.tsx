"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTask, downloadTaskResult, getTask, listTaskResults } from "@/services/tasks";
import type { Task, TaskResult } from "@/types/task";

interface TaskResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("ko-KR", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function taskStatusLabel(status: string): string {
  if (status === "pending") {
    return "대기 중";
  }
  if (status === "running") {
    return "실행 중";
  }
  if (status === "completed") {
    return "완료";
  }
  if (status === "failed") {
    return "실패";
  }
  if (status === "cancelled") {
    return "취소됨";
  }
  return status;
}

function sortByRecentVersion(results: TaskResult[]): TaskResult[] {
  return [...results].sort((left, right) => {
    if (left.version !== right.version) {
      return right.version - left.version;
    }
    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });
}

export default function TaskResultsPage({ params }: TaskResultsPageProps) {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [revisionRequest, setRevisionRequest] = useState("");
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void params
      .then((resolvedParams) => {
        if (isActive) {
          setTaskId(resolvedParams.id);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("결과 페이지 경로 정보를 확인하지 못했습니다.");
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [params]);

  const loadData = useCallback(async () => {
    if (!taskId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [taskResponse, resultsResponse] = await Promise.all([
        getTask(taskId),
        listTaskResults(taskId),
      ]);

      const sortedResults = sortByRecentVersion(resultsResponse.results);
      setTask(taskResponse);
      setResults(sortedResults);

      const firstType = sortedResults[0]?.result_type ?? "";
      setSelectedType((current) => {
        if (current && sortedResults.some((item) => item.result_type === current)) {
          return current;
        }
        return firstType;
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "결과 데이터를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      void loadData();
    }
  }, [taskId, loadData]);

  const resultTypes = useMemo(() => {
    return Array.from(new Set(results.map((item) => item.result_type)));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!selectedType) {
      return [];
    }
    return results.filter((item) => item.result_type === selectedType);
  }, [results, selectedType]);

  const selectedResult = filteredResults[0] ?? null;
  const canDownload = task !== null && filteredResults.length > 0;

  const handleDownloadAll = async () => {
    if (!task || filteredResults.length === 0 || isDownloading) {
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      for (const result of filteredResults) {
        await downloadTaskResult(task.id, result.id);
      }
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : "결과 다운로드를 완료하지 못했습니다.";
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRevisionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!task) {
      return;
    }

    const requestText = revisionRequest.trim();
    if (requestText.length === 0) {
      setRevisionNotice("수정 요청 내용을 입력해 주세요.");
      return;
    }

    if (isSubmittingRevision) {
      return;
    }

    setIsSubmittingRevision(true);
    setRevisionNotice(null);
    setError(null);

    try {
      const revisionTask = await createTask(task.team_id, {
        type: task.type,
        input: {
          revision_request: requestText,
          source_task_id: task.id,
          source_result_type: selectedType,
          source_result_ids: filteredResults.map((item) => item.id),
        },
        options: {
          ...task.options,
          is_revision: true,
          source_task_id: task.id,
        },
      });

      router.push(`/tasks/${revisionTask.id}/monitor`);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "수정 요청 작업 생성에 실패했습니다.";
      setRevisionNotice(message);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-8" data-testid="task-results-loading">
        <h1 className="text-3xl font-black text-foreground">결과물 미리보기</h1>
        <p className="text-muted-foreground">작업 결과를 불러오는 중...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4 py-8" data-testid="task-results-error">
        <h1 className="text-3xl font-black text-foreground">결과물 미리보기</h1>
        <div className="border-[3px] border-red-500 bg-red-50 p-4 text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <p className="font-bold">결과 페이지를 불러오지 못했습니다.</p>
          <p className="text-sm">{error ?? "잠시 후 다시 시도해 주세요."}</p>
        </div>
        <Button type="button" onClick={() => void loadData()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4" data-testid="task-results-page">
      <header className="flex flex-col gap-3 border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">결과물 미리보기</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.team_name} · Task ID: <span className="font-mono">{task.id}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">완료 시각: {formatDateTime(task.completed_at)}</p>
        </div>
        <span className="inline-flex items-center border-[2px] border-foreground bg-gray-50 px-3 py-1 text-xs font-bold text-foreground">
          상태: {taskStatusLabel(task.status)}
        </span>
      </header>

      {task.status !== "completed" ? (
        <div className="border-[3px] border-amber-500 bg-amber-50 p-4 text-sm text-amber-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          작업이 아직 완료되지 않았습니다. 실시간 모니터링에서 상태를 확인한 뒤 다시 결과 페이지를 확인하세요. {" "}
          <Link href={`/tasks/${task.id}/monitor`} className="font-bold underline">
            모니터링으로 이동
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="border-[3px] border-red-500 bg-red-50 p-4 text-sm text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{error}</div>
      ) : null}

      <section
        className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        aria-label="결과물 탭"
        data-testid="result-tabs"
      >
        <h2 className="text-lg font-black text-foreground">결과 탭</h2>
        <p className="mt-1 text-sm text-muted-foreground">결과 유형별로 콘텐츠를 전환해 확인합니다.</p>

        {resultTypes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">표시할 결과가 아직 없습니다.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {resultTypes.map((resultType) => (
              <button
                key={resultType}
                type="button"
                className={`border-[2px] px-3 py-1 text-sm font-bold ${
                  selectedType === resultType
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-foreground bg-white text-foreground"
                }`}
                onClick={() => setSelectedType(resultType)}
              >
                {resultType}
              </button>
            ))}
          </div>
        )}
      </section>

      <section
        className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        aria-label="결과 콘텐츠"
        data-testid="result-content"
      >
        <h2 className="text-lg font-black text-foreground">결과 콘텐츠</h2>
        <p className="mt-1 text-sm text-muted-foreground">선택한 탭의 최신 버전 콘텐츠를 미리보기합니다.</p>

        {selectedResult ? (
          <pre className="mt-4 max-h-[480px] overflow-auto border-[2px] border-foreground bg-gray-50 p-4 text-sm text-foreground whitespace-pre-wrap">
            {selectedResult.content}
          </pre>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">선택된 결과가 없습니다.</p>
        )}
      </section>

      <section
        className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        aria-label="결과 메타데이터"
        data-testid="result-metadata"
      >
        <h2 className="text-lg font-black text-foreground">결과 메타데이터</h2>
        <p className="mt-1 text-sm text-muted-foreground">생성 정보, 품질 점수, 버전 정보를 확인합니다.</p>

        {selectedResult ? (
          <dl className="mt-4 grid gap-2 text-sm text-foreground">
            <div className="flex justify-between gap-4 border-b-[2px] border-dashed border-foreground/20 pb-2">
              <dt className="font-bold">result_type</dt>
              <dd>{selectedResult.result_type}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b-[2px] border-dashed border-foreground/20 pb-2">
              <dt className="font-bold">agent_id</dt>
              <dd>{selectedResult.agent_id}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b-[2px] border-dashed border-foreground/20 pb-2">
              <dt className="font-bold">version</dt>
              <dd>v{selectedResult.version}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b-[2px] border-dashed border-foreground/20 pb-2">
              <dt className="font-bold">quality_score</dt>
              <dd>{selectedResult.quality_score ?? "-"}</dd>
            </div>
            {selectedResult.quality_score !== null ? (
              <div className="flex justify-end">
                <span className="inline-flex items-center border-[2px] border-green-600 bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                  품질 점수: {selectedResult.quality_score}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-b-[2px] border-dashed border-foreground/20 pb-2">
              <dt className="font-bold">created_at</dt>
              <dd>{formatDateTime(selectedResult.created_at)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-bold">metadata</dt>
              <dd className="border-[2px] border-foreground bg-gray-50 p-3 text-xs text-foreground">
                {JSON.stringify(selectedResult.metadata, null, 2)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">메타데이터를 표시할 결과가 없습니다.</p>
        )}
      </section>

      <section
        className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        aria-label="수정 요청"
        data-testid="revision-form"
      >
        <h2 className="text-lg font-black text-foreground">수정 요청</h2>
        <p className="mt-1 text-sm text-muted-foreground">수정 요청 텍스트를 작성해 다음 작업으로 이어집니다.</p>

        <form className="mt-4 space-y-3" onSubmit={handleRevisionSubmit}>
          <textarea
            className="min-h-28 w-full border-[2px] border-foreground px-3 py-2 text-sm"
            placeholder="수정 요청 내용을 입력하세요."
            value={revisionRequest}
            onChange={(event) => setRevisionRequest(event.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={isSubmittingRevision}>
              {isSubmittingRevision ? "요청 중..." : "수정 요청"}
            </Button>
          </div>
        </form>

        {revisionNotice ? (
          <p className="mt-3 border-[2px] border-blue-600 bg-blue-50 px-3 py-2 text-sm text-blue-700 font-bold">{revisionNotice}</p>
        ) : null}
      </section>

      <div className="flex flex-wrap justify-end gap-2" data-testid="download-all-button">
        <Button type="button" variant="outline" onClick={() => void handleDownloadAll()} disabled={!canDownload || isDownloading}>
          {isDownloading ? "다운로드 중..." : "전체 다운로드"}
        </Button>
      </div>
    </div>
  );
}
