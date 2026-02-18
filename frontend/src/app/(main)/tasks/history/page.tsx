"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listTasks } from "@/services/tasks";
import { listTeams } from "@/services/teams";
import type { Task } from "@/types/task";
import type { Team } from "@/types/team";

const PAGE_SIZE = 10;

interface TaskHistoryFilters {
  teamId?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
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
  });
}

function statusLabel(status: string): string {
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

function statusClassName(status: string): string {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "failed" || status === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === "running") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function toStartOfDayIso(dateInput: string): string {
  return `${dateInput}T00:00:00Z`;
}

function toEndOfDayIso(dateInput: string): string {
  return `${dateInput}T23:59:59.999Z`;
}

export default function TaskHistoryPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<TaskHistoryFilters>({});

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [total]);

  const loadTeams = useCallback(async () => {
    try {
      const response = await listTeams();
      setTeams(response.teams);
    } catch {
      setTeams([]);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listTasks({
        ...appliedFilters,
        page,
        limit: PAGE_SIZE,
      });
      setTasks(response.tasks);
      setTotal(response.total);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "작업 이력을 불러오지 못했습니다.";
      setError(message);
      setTasks([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleApplyFilters = () => {
    if (fromDateFilter && toDateFilter && fromDateFilter > toDateFilter) {
      setError("시작일은 종료일보다 늦을 수 없습니다.");
      return;
    }

    setError(null);
    setPage(1);
    setAppliedFilters({
      teamId: teamFilter || undefined,
      status: statusFilter || undefined,
      createdFrom: fromDateFilter ? toStartOfDayIso(fromDateFilter) : undefined,
      createdTo: toDateFilter ? toEndOfDayIso(toDateFilter) : undefined,
    });
  };

  const handleResetFilters = () => {
    setTeamFilter("");
    setStatusFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setError(null);
    setPage(1);
    setAppliedFilters({});
  };

  const handleRowClick = (taskId: string) => {
    router.push(`/tasks/${taskId}/results`);
  };

  return (
    <div className="space-y-6 py-4" data-testid="task-history-page">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">작업 이력</h1>
        <p className="text-slate-600">팀별 작업 히스토리를 조회하고 결과 화면으로 이동할 수 있습니다.</p>
      </header>

      <section
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        data-testid="task-history-filters"
      >
        <h2 className="text-lg font-semibold text-slate-900">필터</h2>
        <p className="mt-1 text-sm text-slate-600">팀, 상태, 날짜 조건으로 작업 이력을 필터링합니다.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">팀</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="">전체 팀</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">상태</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">전체 상태</option>
              <option value="pending">대기 중</option>
              <option value="running">실행 중</option>
              <option value="completed">완료</option>
              <option value="failed">실패</option>
              <option value="cancelled">취소됨</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">시작일</span>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={fromDateFilter}
              onChange={(event) => setFromDateFilter(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">종료일</span>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={toDateFilter}
              onChange={(event) => setToDateFilter(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleResetFilters}>
            초기화
          </Button>
          <Button type="button" onClick={handleApplyFilters}>
            필터 적용
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="task-history-table">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">작업 목록</h2>
          <p className="text-sm text-slate-600">
            총 {total}개 · {page}/{totalPages} 페이지
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-slate-600">작업 목록을 불러오는 중...</p>
        ) : tasks.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 p-8 text-center" data-testid="task-history-empty">
            <p className="font-medium text-slate-700">조건에 맞는 작업이 없습니다.</p>
            <p className="mt-1 text-sm text-slate-500">필터를 조정하거나 다른 기간을 선택해 보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="rounded-l-md border border-slate-200 px-3 py-2">생성 시각</th>
                  <th className="border-y border-slate-200 px-3 py-2">팀</th>
                  <th className="border-y border-slate-200 px-3 py-2">유형</th>
                  <th className="border-y border-slate-200 px-3 py-2">상태</th>
                  <th className="rounded-r-md border border-slate-200 px-3 py-2">소요 시간</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer outline-none transition-colors hover:bg-slate-50 focus:bg-slate-50"
                    onClick={() => handleRowClick(task.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleRowClick(task.id);
                      }
                    }}
                  >
                    <td className="border-b border-slate-200 px-3 py-3 text-slate-700">{formatDateTime(task.created_at)}</td>
                    <td className="border-b border-slate-200 px-3 py-3 text-slate-700">{task.team_name}</td>
                    <td className="border-b border-slate-200 px-3 py-3 text-slate-700">{task.type}</td>
                    <td className="border-b border-slate-200 px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusClassName(task.status)}`}>
                        {statusLabel(task.status)}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3 text-slate-700">{task.duration ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2" data-testid="task-history-pagination">
          <Button type="button" variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            이전
          </Button>
          <span className="px-2 text-sm text-slate-600">{page} / {totalPages}</span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            다음
          </Button>
        </div>
      </section>
    </div>
  );
}
