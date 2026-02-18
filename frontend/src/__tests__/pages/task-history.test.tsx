import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import TaskHistoryPage from "@/app/(main)/tasks/history/page";
import { listTasks } from "@/services/tasks";
import { listTeams } from "@/services/teams";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/services/tasks", () => ({
  listTasks: vi.fn(),
}));

vi.mock("@/services/teams", () => ({
  listTeams: vi.fn(),
}));

const mockPush = vi.fn();

const TEAMS_FIXTURE = {
  teams: [
    {
      id: "team-1",
      user_id: "user-1",
      name: "마케팅 팀",
      description: "marketing",
      template_id: null,
      config: {},
      status: "active",
      agent_count: 3,
      recent_task_count: 2,
      created_at: "2026-02-18T00:00:00Z",
      updated_at: "2026-02-18T00:00:00Z",
    },
    {
      id: "team-2",
      user_id: "user-1",
      name: "리서치 팀",
      description: "research",
      template_id: null,
      config: {},
      status: "active",
      agent_count: 2,
      recent_task_count: 1,
      created_at: "2026-02-18T00:00:00Z",
      updated_at: "2026-02-18T00:00:00Z",
    },
  ],
  total: 2,
};

const TASKS_FIXTURE = {
  tasks: [
    {
      id: "task-1",
      team_id: "team-1",
      user_id: "user-1",
      type: "content",
      input: {},
      options: {},
      status: "running",
      progress: 40,
      started_at: "2026-02-18T01:00:00Z",
      completed_at: null,
      created_at: "2026-02-18T01:00:00Z",
      team_name: "마케팅 팀",
      duration: null,
    },
    {
      id: "task-2",
      team_id: "team-2",
      user_id: "user-1",
      type: "report",
      input: {},
      options: {},
      status: "completed",
      progress: 100,
      started_at: "2026-02-17T22:00:00Z",
      completed_at: "2026-02-17T22:20:00Z",
      created_at: "2026-02-17T22:00:00Z",
      team_name: "리서치 팀",
      duration: "20m",
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
};

describe("TaskHistoryPage", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    });

    mockPush.mockClear();
    vi.mocked(listTeams).mockResolvedValue(TEAMS_FIXTURE);
    vi.mocked(listTasks).mockResolvedValue(TASKS_FIXTURE);
  });

  it("초기 로드 시 필터와 작업 목록을 표시한다", async () => {
    render(<TaskHistoryPage />);

    await screen.findByRole("heading", { name: "작업 이력" });
    await screen.findByText("content");

    expect(screen.getByTestId("task-history-filters")).toBeInTheDocument();
    expect(screen.getByTestId("task-history-table")).toBeInTheDocument();

    expect(listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
  });

  it("필터 적용 시 팀/상태/날짜 조건으로 다시 조회한다", async () => {
    const user = userEvent.setup();
    render(<TaskHistoryPage />);

    await screen.findByText("content");

    await user.selectOptions(screen.getByLabelText("팀"), "team-2");
    await user.selectOptions(screen.getByLabelText("상태"), "completed");
    await user.type(screen.getByLabelText("시작일"), "2026-02-01");
    await user.type(screen.getByLabelText("종료일"), "2026-02-05");
    await user.click(screen.getByRole("button", { name: "필터 적용" }));

    await waitFor(() => {
      const latestCall = vi.mocked(listTasks).mock.calls.at(-1)?.[0];
      expect(latestCall).toMatchObject({
        teamId: "team-2",
        status: "completed",
        createdFrom: "2026-02-01T00:00:00Z",
        createdTo: "2026-02-05T23:59:59.999Z",
        page: 1,
        limit: 10,
      });
    });
  });

  it("페이지네이션 다음 버튼 클릭 시 다음 페이지를 조회한다", async () => {
    const user = userEvent.setup();

    vi.mocked(listTasks).mockImplementation(async (params) => {
      if (params?.page === 2) {
        return {
          tasks: [
            {
              ...TASKS_FIXTURE.tasks[0],
              id: "task-11",
              team_name: "리서치 팀",
              type: "summary",
              created_at: "2026-02-16T10:00:00Z",
            },
          ],
          total: 11,
          page: 2,
          limit: 10,
        };
      }

      return {
        tasks: TASKS_FIXTURE.tasks,
        total: 11,
        page: 1,
        limit: 10,
      };
    });

    render(<TaskHistoryPage />);

    await screen.findByText("content");
    await user.click(screen.getByRole("button", { name: "다음" }));

    await waitFor(() => {
      expect(listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
      );
    });

    expect(await screen.findByText("summary")).toBeInTheDocument();
  });

  it("행 클릭 시 결과 페이지로 이동한다", async () => {
    const user = userEvent.setup();
    render(<TaskHistoryPage />);

    const rowCell = await screen.findByText("content");
    await user.click(rowCell);

    expect(mockPush).toHaveBeenCalledWith("/tasks/task-1/results");
  });
});
