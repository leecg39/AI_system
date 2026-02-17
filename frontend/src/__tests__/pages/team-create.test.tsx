import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import TeamCreatePage from "@/app/(main)/teams/new/page";
import { createAgent } from "@/services/agents";
import { listTemplates } from "@/services/templates";
import { createTeam } from "@/services/teams";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/services/templates", () => ({
  listTemplates: vi.fn(),
}));

vi.mock("@/services/teams", () => ({
  createTeam: vi.fn(),
}));

vi.mock("@/services/agents", () => ({
  createAgent: vi.fn(),
}));

const mockPush = vi.fn();

const TEMPLATE_FIXTURE = {
  templates: [
    {
      id: "template-marketing",
      name: "마케팅 팀",
      description: "마케팅 콘텐츠 자동화",
      category: "marketing",
      icon: "megaphone",
      default_agents: [
        {
          name: "content_director",
          role: "Director",
          layer: "orchestration",
          model: "sonnet",
          prompt_template: "analyze source",
        },
      ],
      is_active: true,
    },
  ],
  total: 1,
};

describe("TeamCreatePage", () => {
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

    vi.mocked(listTemplates).mockResolvedValue(TEMPLATE_FIXTURE);
    vi.mocked(createTeam).mockResolvedValue({
      id: "team-created",
      user_id: "user-1",
      name: "마케팅 팀",
      description: "마케팅 콘텐츠 자동화",
      template_id: "template-marketing",
      config: {},
      status: "active",
      agent_count: 0,
      recent_task_count: 0,
      created_at: "2026-02-17T00:00:00Z",
      updated_at: "2026-02-17T00:00:00Z",
    });
    vi.mocked(createAgent).mockResolvedValue({
      id: "agent-created",
      team_id: "team-created",
      name: "content_director",
      role: "Director",
      layer: "orchestration",
      model: "sonnet",
      prompt_template: "analyze source",
      tools: [],
      sort_order: 0,
      status: "idle",
      created_at: "2026-02-17T00:00:00Z",
      updated_at: "2026-02-17T00:00:00Z",
    });
  });

  it("템플릿 선택 시 Step 2로 이동하고 기본 에이전트를 표시한다", async () => {
    const user = userEvent.setup();

    render(<TeamCreatePage />);

    const templateButton = await screen.findByRole("button", { name: "이 템플릿 선택" });
    await user.click(templateButton);

    expect(screen.getByDisplayValue("마케팅 팀")).toBeInTheDocument();
    expect(screen.getByDisplayValue("content_director")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Director")).toBeInTheDocument();
  });

  it("에이전트 추가/편집 후 확인 단계에서 반영된 내용을 표시한다", async () => {
    const user = userEvent.setup();

    render(<TeamCreatePage />);

    const templateButton = await screen.findByRole("button", { name: "이 템플릿 선택" });
    await user.click(templateButton);

    await user.click(screen.getByRole("button", { name: "에이전트 추가" }));

    const nameInputs = screen.getAllByPlaceholderText("이름");
    const roleInputs = screen.getAllByPlaceholderText("역할");
    const promptInputs = screen.getAllByPlaceholderText("프롬프트");

    await user.type(nameInputs[nameInputs.length - 1], "qa_reviewer");
    await user.type(roleInputs[roleInputs.length - 1], "QA Reviewer");
    await user.type(promptInputs[promptInputs.length - 1], "review quality");

    await user.click(screen.getByRole("button", { name: "확인 단계로 이동" }));

    expect(screen.getByRole("heading", { name: "최종 확인" })).toBeInTheDocument();
    expect(screen.getByText(/qa_reviewer/)).toBeInTheDocument();
  });

  it("팀 생성 완료 시 팀/에이전트 API 호출 후 대시보드로 이동한다", async () => {
    const user = userEvent.setup();

    render(<TeamCreatePage />);

    const templateButton = await screen.findByRole("button", { name: "이 템플릿 선택" });
    await user.click(templateButton);

    await user.click(screen.getByRole("button", { name: "확인 단계로 이동" }));
    await user.click(screen.getByRole("button", { name: "팀 생성" }));

    await waitFor(() => {
      expect(createTeam).toHaveBeenCalled();
      expect(createAgent).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("프롬프트와 모델 값을 수정할 수 있다", async () => {
    const user = userEvent.setup();

    render(<TeamCreatePage />);

    const templateButton = await screen.findByRole("button", { name: "이 템플릿 선택" });
    await user.click(templateButton);

    const promptInput = screen.getByDisplayValue("analyze source");
    await user.clear(promptInput);
    await user.type(promptInput, "rewrite strategy");

    const modelSelect = screen.getByLabelText("에이전트 모델 content_director");
    await user.selectOptions(modelSelect, "opus");

    expect(screen.getByDisplayValue("rewrite strategy")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "opus" })).toBeInTheDocument();
  });
});
