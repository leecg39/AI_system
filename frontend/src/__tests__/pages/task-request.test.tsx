import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import TaskRequestPage from "@/app/(main)/teams/[id]/tasks/new/page";
import { listAgents } from "@/services/agents";
import { createTask } from "@/services/tasks";
import { getTeamById } from "@/services/teams";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/services/teams", () => ({
  getTeamById: vi.fn(),
}));

vi.mock("@/services/agents", () => ({
  listAgents: vi.fn(),
}));

vi.mock("@/services/tasks", () => ({
  createTask: vi.fn(),
}));

const mockPush = vi.fn();

const TEAM_FIXTURE = {
  id: "team-1",
  user_id: "user-1",
  name: "마케팅 팀",
  description: "콘텐츠 자동화",
  template_id: null,
  config: { category: "marketing" },
  status: "active",
  agent_count: 2,
  recent_task_count: 0,
  created_at: "2026-02-18T00:00:00Z",
  updated_at: "2026-02-18T00:00:00Z",
};

const AGENTS_FIXTURE = {
  agents: [
    {
      id: "agent-1",
      team_id: "team-1",
      name: "content_director",
      role: "Director",
      layer: "orchestration",
      model: "sonnet",
      prompt_template: null,
      tools: [],
      sort_order: 0,
      status: "idle",
      created_at: "2026-02-18T00:00:00Z",
      updated_at: "2026-02-18T00:00:00Z",
    },
    {
      id: "agent-2",
      team_id: "team-1",
      name: "blog_writer",
      role: "Writer",
      layer: "execution",
      model: "haiku",
      prompt_template: null,
      tools: [],
      sort_order: 1,
      status: "idle",
      created_at: "2026-02-18T00:00:00Z",
      updated_at: "2026-02-18T00:00:00Z",
    },
  ],
  total: 2,
};

describe("TaskRequestPage", () => {
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

    vi.mocked(getTeamById).mockResolvedValue(TEAM_FIXTURE);
    vi.mocked(listAgents).mockResolvedValue(AGENTS_FIXTURE);
    vi.mocked(createTask).mockResolvedValue({
      id: "task-created",
      team_id: "team-1",
      user_id: "user-1",
      type: "content",
      input: {},
      options: {},
      status: "pending",
      progress: 0,
      started_at: null,
      completed_at: null,
      created_at: "2026-02-18T00:00:00Z",
      team_name: "마케팅 팀",
      duration: null,
    });
  });

  it("1단계 선택 후 다음을 누르면 2단계 입력 화면으로 이동한다", async () => {
    const user = userEvent.setup();

    render(<TaskRequestPage params={Promise.resolve({ id: "team-1" })} />);

    const nextButton = await screen.findByRole("button", { name: "입력 단계로 이동" });
    await user.click(nextButton);

    expect(screen.getByRole("heading", { name: "2단계: 입력" })).toBeInTheDocument();
  });

  it("URL 입력 후 실행하면 작업 생성 API 호출 뒤 모니터링 페이지로 이동한다", async () => {
    const user = userEvent.setup();

    render(<TaskRequestPage params={Promise.resolve({ id: "team-1" })} />);

    const nextButton = await screen.findByRole("button", { name: "입력 단계로 이동" });
    await user.click(nextButton);

    await user.type(await screen.findByLabelText("소스 URL"), "https://www.youtube.com/watch?v=abc123");
    await user.click(await screen.findByRole("button", { name: "확인 단계로 이동" }));
    await user.click(await screen.findByRole("button", { name: "작업 실행" }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        "team-1",
        expect.objectContaining({
          type: "content",
          input: expect.objectContaining({
            url: "https://www.youtube.com/watch?v=abc123",
          }),
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/tasks/task-created/monitor");
    });
  });

  it("파일 업로드 시 파일 미리보기가 표시된다", async () => {
    const user = userEvent.setup();

    render(<TaskRequestPage params={Promise.resolve({ id: "team-1" })} />);

    const nextButton = await screen.findByRole("button", { name: "입력 단계로 이동" });
    await user.click(nextButton);

    const fileInput = await screen.findByLabelText("파일 업로드");
    const file = new File(["example"], "brief.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    expect(screen.getByText(/brief\.pdf/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "확인 단계로 이동" })).toBeEnabled();
  });

  it("3단계에서 선택한 옵션 요약을 확인할 수 있다", async () => {
    const user = userEvent.setup();

    render(<TaskRequestPage params={Promise.resolve({ id: "team-1" })} />);

    await screen.findByRole("button", { name: "입력 단계로 이동" });

    const snsOutputCheckbox = await screen.findByRole("checkbox", { name: "SNS 포스트" });
    await user.click(snsOutputCheckbox);
    await user.click(await screen.findByRole("button", { name: "입력 단계로 이동" }));

    await user.type(await screen.findByLabelText("입력 텍스트"), "브랜드 메시지를 강조해 주세요.");
    await user.type(await screen.findByLabelText("세부 요청사항"), "20대 대상, 경쾌한 톤");
    await user.click(await screen.findByRole("button", { name: "확인 단계로 이동" }));

    expect(screen.getByRole("heading", { name: "3단계: 실행 전 확인" })).toBeInTheDocument();
    expect(screen.getByText("콘텐츠 작성")).toBeInTheDocument();
    expect(screen.getByText(/블로그, SNS 포스트/)).toBeInTheDocument();
    expect(screen.getByText("20대 대상, 경쾌한 톤")).toBeInTheDocument();
  });
});
