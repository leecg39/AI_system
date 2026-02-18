import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { useRouter } from "next/navigation";
import TaskResultsPage from "@/app/(main)/tasks/[id]/results/page";
import { createTask, downloadTaskResult, getTask, listTaskResults } from "@/services/tasks";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/services/tasks", () => ({
  getTask: vi.fn(),
  listTaskResults: vi.fn(),
  downloadTaskResult: vi.fn(),
  createTask: vi.fn(),
}));

const mockPush = vi.fn();

const TASK_FIXTURE = {
  id: "task-1",
  team_id: "team-1",
  user_id: "user-1",
  type: "content",
  input: {},
  options: { tone: "friendly" },
  status: "completed",
  progress: 100,
  started_at: "2026-02-18T00:00:00Z",
  completed_at: "2026-02-18T00:10:00Z",
  created_at: "2026-02-18T00:00:00Z",
  team_name: "마케팅 팀",
  duration: "10m",
};

const RESULTS_FIXTURE = {
  results: [
    {
      id: "result-blog-v2",
      task_id: "task-1",
      agent_id: "agent-1",
      result_type: "blog",
      content: "최신 블로그 결과",
      file_url: null,
      metadata: { model: "sonnet" },
      quality_score: 92,
      version: 2,
      created_at: "2026-02-18T00:09:00Z",
    },
    {
      id: "result-blog-v1",
      task_id: "task-1",
      agent_id: "agent-1",
      result_type: "blog",
      content: "이전 블로그 결과",
      file_url: null,
      metadata: { model: "sonnet" },
      quality_score: 85,
      version: 1,
      created_at: "2026-02-18T00:08:00Z",
    },
    {
      id: "result-sns-v1",
      task_id: "task-1",
      agent_id: "agent-2",
      result_type: "sns",
      content: "SNS 포스트 결과",
      file_url: null,
      metadata: { model: "haiku" },
      quality_score: 88,
      version: 1,
      created_at: "2026-02-18T00:07:00Z",
    },
  ],
  total: 3,
};

describe("Task results integration flow", () => {
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
    vi.mocked(getTask).mockResolvedValue(TASK_FIXTURE);
    vi.mocked(listTaskResults).mockResolvedValue(RESULTS_FIXTURE);
    vi.mocked(downloadTaskResult).mockResolvedValue(undefined);
    vi.mocked(createTask).mockResolvedValue({
      ...TASK_FIXTURE,
      id: "task-revision-1",
      status: "pending",
      progress: 0,
      completed_at: null,
    });
  });

  it("shows tabs and renders first result content on initial load", async () => {
    render(createElement(TaskResultsPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-results-page");

    expect(screen.getByRole("button", { name: "blog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "sns" })).toBeInTheDocument();
    expect(screen.getByText("최신 블로그 결과")).toBeInTheDocument();
  });

  it("submits revision request and navigates to new monitor task", async () => {
    const user = userEvent.setup();
    render(createElement(TaskResultsPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-results-page");
    await user.type(screen.getByPlaceholderText("수정 요청 내용을 입력하세요."), "문장을 더 간결하게 수정해 주세요.");
    await user.click(screen.getByRole("button", { name: "수정 요청" }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        "team-1",
        expect.objectContaining({
          type: "content",
          input: expect.objectContaining({
            revision_request: "문장을 더 간결하게 수정해 주세요.",
            source_task_id: "task-1",
            source_result_type: "blog",
            source_result_ids: ["result-blog-v2", "result-blog-v1"],
          }),
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/tasks/task-revision-1/monitor");
    });
  });

  it("starts download for selected result type when clicking download all", async () => {
    const user = userEvent.setup();
    render(createElement(TaskResultsPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-results-page");
    await user.click(screen.getByRole("button", { name: "전체 다운로드" }));

    await waitFor(() => {
      expect(downloadTaskResult).toHaveBeenCalledTimes(2);
      expect(downloadTaskResult).toHaveBeenCalledWith("task-1", "result-blog-v2");
      expect(downloadTaskResult).toHaveBeenCalledWith("task-1", "result-blog-v1");
    });
  });

  it("shows quality score badge in metadata", async () => {
    render(createElement(TaskResultsPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-results-page");
    expect(screen.getByText("품질 점수: 92")).toBeInTheDocument();
  });
});
