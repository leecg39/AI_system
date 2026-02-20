"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { authLib } from "@/lib/auth";
import { listAgents } from "@/services/agents";
import { cancelTask, getTask, listTaskLogs } from "@/services/tasks";
import type { Agent } from "@/types/agent";
import type { Task, TaskLog } from "@/types/task";

interface TaskMonitorPageProps {
  params: Promise<{
    id: string;
  }>;
}

type AgentRuntimeStatus = "waiting" | "running" | "completed" | "failed" | "cancelled";

interface AgentRuntimeState {
  status: AgentRuntimeStatus;
  progress: number;
  message: string;
  updatedAt: string | null;
}

const POLLING_INTERVAL_MS = 4000;
const TERMINAL_TASK_STATUSES = new Set(["completed", "failed", "cancelled"]);
const LAYER_ORDER: Record<string, number> = {
  orchestration: 0,
  research: 1,
  execution: 2,
  quality: 3,
};

function toWsBaseUrl(apiUrl: string): string {
  try {
    const parsed = new URL(apiUrl);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}`;
  } catch {
    return "ws://localhost:8000";
  }
}

function normalizeProgress(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapRuntimeStatus(status: string): AgentRuntimeStatus {
  if (status === "completed") {
    return "completed";
  }
  if (status === "error" || status === "failed") {
    return "failed";
  }
  if (status === "cancelled") {
    return "cancelled";
  }
  if (status === "started" || status === "processing" || status === "running") {
    return "running";
  }
  return "waiting";
}

function sortLogs(logs: TaskLog[]): TaskLog[] {
  return [...logs].sort((left, right) => {
    const leftTime = Date.parse(left.created_at);
    const rightTime = Date.parse(right.created_at);
    return leftTime - rightTime;
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

function taskStatusClass(status: string): string {
  if (status === "completed") {
    return "border-green-600 bg-green-50 text-green-700";
  }
  if (status === "failed" || status === "cancelled") {
    return "border-red-500 bg-red-50 text-red-700";
  }
  if (status === "running") {
    return "border-blue-600 bg-blue-50 text-blue-700";
  }
  return "border-amber-500 bg-amber-50 text-amber-700";
}

function runtimeStatusMeta(status: AgentRuntimeStatus): {
  icon: string;
  label: string;
  className: string;
} {
  if (status === "running") {
    return {
      icon: "🟢",
      label: "작업중",
      className: "border-blue-600 bg-blue-50 text-blue-700",
    };
  }
  if (status === "completed") {
    return {
      icon: "✅",
      label: "완료",
      className: "border-green-600 bg-green-50 text-green-700",
    };
  }
  if (status === "failed") {
    return {
      icon: "🔴",
      label: "오류",
      className: "border-red-500 bg-red-50 text-red-700",
    };
  }
  if (status === "cancelled") {
    return {
      icon: "⛔",
      label: "취소",
      className: "border-gray-500 bg-gray-100 text-gray-700",
    };
  }
  return {
    icon: "🟡",
    label: "대기",
    className: "border-amber-500 bg-amber-50 text-amber-700",
  };
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

function buildInitialAgentStates(agents: Agent[], logs: TaskLog[]): Record<string, AgentRuntimeState> {
  const initial: Record<string, AgentRuntimeState> = {};
  for (const agent of agents) {
    initial[agent.id] = {
      status: "waiting",
      progress: 0,
      message: "대기 중",
      updatedAt: null,
    };
  }

  const sortedLogs = sortLogs(logs);
  for (const log of sortedLogs) {
    if (!initial[log.agent_id]) {
      continue;
    }
    initial[log.agent_id] = {
      status: mapRuntimeStatus(log.status),
      progress: normalizeProgress(log.progress, initial[log.agent_id].progress),
      message: log.message,
      updatedAt: log.created_at,
    };
  }

  return initial;
}

export default function TaskMonitorPage({ params }: TaskMonitorPageProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, AgentRuntimeState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLogCollapsed, setIsLogCollapsed] = useState(false);
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">(
    "idle",
  );
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
          setError("작업 경로 정보를 확인하지 못했습니다.");
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [params]);
  const [streamError, setStreamError] = useState<string | null>(null);

  const applyAgentEvent = useCallback(
    (agentId: string, status: string, progressValue: unknown, message: string) => {
      setAgentStates((current) => {
        if (!current[agentId]) {
          return current;
        }

        return {
          ...current,
          [agentId]: {
            ...current[agentId],
            status: mapRuntimeStatus(status),
            progress: normalizeProgress(progressValue, current[agentId].progress),
            message: message || current[agentId].message,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [],
  );

  const refreshLogs = useCallback(
    async (taskId: string, agentList: Agent[]) => {
      const logsResponse = await listTaskLogs(taskId);
      const sortedLogs = sortLogs(logsResponse.logs);
      setLogs(sortedLogs);
      setAgentStates(buildInitialAgentStates(agentList, sortedLogs));
    },
    [],
  );

  const loadMonitor = useCallback(async () => {
    if (!taskId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const taskResponse = await getTask(taskId);
      const [agentsResponse, logsResponse] = await Promise.all([
        listAgents(taskResponse.team_id),
        listTaskLogs(taskResponse.id),
      ]);

      const sortedLogs = sortLogs(logsResponse.logs);

      setTask(taskResponse);
      setAgents(agentsResponse.agents);
      setLogs(sortedLogs);
      setAgentStates(buildInitialAgentStates(agentsResponse.agents, sortedLogs));
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "모니터링 데이터를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      void loadMonitor();
    }
  }, [taskId, loadMonitor]);

  useEffect(() => {
    if (!task || TERMINAL_TASK_STATUSES.has(task.status)) {
      return;
    }

    let stopped = false;

    const refresh = async () => {
      try {
        const [taskResponse, logsResponse] = await Promise.all([getTask(task.id), listTaskLogs(task.id)]);
        if (stopped) {
          return;
        }

        const sortedLogs = sortLogs(logsResponse.logs);
        setTask(taskResponse);
        setLogs(sortedLogs);
        setAgentStates(buildInitialAgentStates(agents, sortedLogs));
      } catch {
        if (!stopped) {
          setStreamError("실시간 로그를 갱신하지 못했습니다.");
        }
      }
    };

    const timer = window.setInterval(() => {
      void refresh();
    }, POLLING_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [agents, task]);

  useEffect(() => {
    if (!task) {
      return;
    }

    const token = authLib.getToken();
    if (!token) {
      setStreamStatus("disconnected");
      setStreamError("로그인을 다시 진행하면 실시간 스트림에 연결됩니다.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const socketUrl = `${toWsBaseUrl(apiUrl)}/ws/tasks/${task.id}?token=${encodeURIComponent(token)}`;

    let active = true;
    let pingTimer: number | null = null;

    setStreamStatus("connecting");
    setStreamError(null);

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      if (!active) {
        return;
      }
      setStreamStatus("connected");
      pingTimer = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ action: "ping" }));
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      if (!active) {
        return;
      }

      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        const eventType = typeof payload.type === "string" ? payload.type : "";

        if (eventType === "progress_update") {
          const nextStatus = typeof payload.status === "string" ? payload.status : null;
          const nextProgress = payload.progress;

          setTask((current) => {
            if (!current) {
              return current;
            }
            return {
              ...current,
              status: nextStatus ?? current.status,
              progress: normalizeProgress(nextProgress, current.progress),
            };
          });

          if (typeof payload.error === "string") {
            setStreamError(payload.error);
          }

          return;
        }

        if (eventType === "agent_update") {
          const agentId = typeof payload.agent_id === "string" ? payload.agent_id : "";
          const status = typeof payload.status === "string" ? payload.status : "processing";
          const message = typeof payload.message === "string" ? payload.message : "에이전트 상태가 변경되었습니다.";

          if (agentId) {
            applyAgentEvent(agentId, status, payload.progress, message);
          }

          return;
        }

        if (eventType === "event") {
          const agentId = typeof payload.agent_id === "string" ? payload.agent_id : null;
          const status = typeof payload.status === "string" ? payload.status : "processing";
          const message = typeof payload.message === "string" ? payload.message : "이벤트 수신";
          if (agentId) {
            applyAgentEvent(agentId, status, payload.progress, message);
          }
        }
      } catch {
        setStreamError("실시간 이벤트를 처리하지 못했습니다.");
      }
    };

    socket.onerror = () => {
      if (!active) {
        return;
      }
      setStreamStatus("disconnected");
      setStreamError("실시간 스트림 연결 중 오류가 발생했습니다.");
    };

    socket.onclose = () => {
      if (!active) {
        return;
      }
      setStreamStatus("disconnected");
    };

    return () => {
      active = false;
      if (pingTimer !== null) {
        window.clearInterval(pingTimer);
      }
      socket.close();
    };
  }, [applyAgentEvent, task]);

  const orderedAgents = useMemo(() => {
    return [...agents].sort((left, right) => {
      const layerDiff = (LAYER_ORDER[left.layer] ?? 99) - (LAYER_ORDER[right.layer] ?? 99);
      if (layerDiff !== 0) {
        return layerDiff;
      }
      return left.sort_order - right.sort_order;
    });
  }, [agents]);

  const visibleLogs = useMemo(() => {
    if (isLogCollapsed && logs.length > 8) {
      return logs.slice(-8);
    }
    return logs;
  }, [isLogCollapsed, logs]);

  const canCancel = task !== null && !TERMINAL_TASK_STATUSES.has(task.status) && !isCancelling;
  const canViewResults = task?.status === "completed";

  const handleCancel = async () => {
    if (!task || !canCancel) {
      return;
    }

    setIsCancelling(true);
    setError(null);

    try {
      const cancelled = await cancelTask(task.id);
      setTask(cancelled);
      await refreshLogs(cancelled.id, agents);
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : "작업 취소에 실패했습니다.";
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-8" data-testid="task-monitor-loading">
        <h1 className="text-3xl font-black text-foreground">실시간 모니터링</h1>
        <p className="text-muted-foreground">작업 상태와 에이전트 로그를 불러오는 중...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4 py-8" data-testid="task-monitor-error">
        <h1 className="text-3xl font-black text-foreground">실시간 모니터링</h1>
        <div className="border-[3px] border-red-500 bg-red-50 p-4 text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <p className="font-bold">작업 정보를 불러오지 못했습니다.</p>
          <p className="text-sm">{error ?? "잠시 후 다시 시도해 주세요."}</p>
        </div>
        <Button type="button" onClick={() => void loadMonitor()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4" data-testid="task-monitor-page">
      <header className="flex flex-col gap-3 border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">실시간 모니터링</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.team_name} · Task ID: <span className="font-mono">{task.id}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">시작 시각: {formatDateTime(task.started_at ?? task.created_at)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center border-[2px] px-3 py-1 text-xs font-bold ${taskStatusClass(task.status)}`}
          >
            상태: {taskStatusLabel(task.status)}
          </span>
          <span
            className={`inline-flex items-center border-[2px] px-3 py-1 text-xs font-bold ${
              streamStatus === "connected"
                ? "border-green-600 bg-green-50 text-green-700"
                : streamStatus === "connecting"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-foreground bg-gray-100 text-muted-foreground"
            }`}
          >
            WS: {streamStatus === "connected" ? "연결됨" : streamStatus === "connecting" ? "연결 중" : "오프라인"}
          </span>
        </div>
      </header>

      {error ? (
        <div className="border-[3px] border-red-500 bg-red-50 p-4 text-sm text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{error}</div>
      ) : null}
      {streamError ? (
        <div className="border-[3px] border-amber-500 bg-amber-50 p-4 text-sm text-amber-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{streamError}</div>
      ) : null}

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="전체 진행률" data-testid="overall-progress">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">전체 진행률</h2>
            <p className="mt-1 text-sm text-muted-foreground">작업 전체의 진행 상태와 완료 여부를 보여줍니다.</p>
          </div>
          <p className="text-2xl font-black text-foreground">{normalizeProgress(task.progress)}%</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden bg-gray-200 border-[2px] border-foreground">
          <div
            className={`h-full transition-all duration-300 ${
              task.status === "completed"
                ? "bg-green-500"
                : task.status === "failed" || task.status === "cancelled"
                  ? "bg-red-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${normalizeProgress(task.progress)}%` }}
          />
        </div>
      </section>

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="에이전트 상태" data-testid="agent-status-grid">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-foreground">에이전트 상태</h2>
          <p className="text-xs text-muted-foreground">🟢작업중 · 🟡대기 · ✅완료 · 🔴오류</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orderedAgents.map((agent) => {
            const runtime = agentStates[agent.id] ?? {
              status: "waiting" as const,
              progress: 0,
              message: "대기 중",
              updatedAt: null,
            };
            const meta = runtimeStatusMeta(runtime.status);

            return (
              <article key={agent.id} className="border-[3px] border-foreground p-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-foreground">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {agent.role} · {agent.layer}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 border-[2px] px-2 py-1 text-xs font-bold ${meta.className}`}>
                    <span aria-hidden>{meta.icon}</span>
                    {meta.label}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{runtime.message}</p>
                <div className="mt-3 h-2 overflow-hidden bg-gray-200 border-[2px] border-foreground">
                  <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${runtime.progress}%` }} />
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">{runtime.progress}%</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" aria-label="로그 스트림" data-testid="log-stream">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">실시간 로그 스트림</h2>
            <p className="text-sm text-muted-foreground">에이전트 로그를 시간 순서대로 확인할 수 있습니다.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setIsLogCollapsed((current) => !current)}>
            {isLogCollapsed ? "로그 펼치기" : "로그 접기"}
          </Button>
        </div>

        {visibleLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">표시할 로그가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {visibleLogs.map((log) => (
              <li key={log.id} className="border-[2px] border-foreground px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-foreground">{log.message}</p>
                  <span className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  agent: {log.agent_id} · status: {log.status} · progress: {normalizeProgress(log.progress)}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => void handleCancel()} disabled={!canCancel}>
          {isCancelling ? "취소 중..." : "작업 취소"}
        </Button>
        {canViewResults ? (
          <Button asChild>
            <Link href={`/tasks/${task.id}/results`}>결과물 보기</Link>
          </Button>
        ) : (
          <Button type="button" disabled>
            결과물 보기
          </Button>
        )}
      </div>
    </div>
  );
}
