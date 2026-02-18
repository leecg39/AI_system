import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamDetailPage from "@/app/(main)/teams/[id]/page";
import { getTeamById } from "@/services/teams";
import { listAgents } from "@/services/agents";

vi.mock("@/services/teams", () => ({
  getTeamById: vi.fn(),
}));

vi.mock("@/services/agents", () => ({
  listAgents: vi.fn(),
}));

const TEAM_FIXTURE = {
  id: "team-1",
  user_id: "user-1",
  name: "마케팅 팀",
  description: "콘텐츠 자동화 팀",
  template_id: null,
  config: {},
  status: "active",
  agent_count: 2,
  recent_task_count: 3,
  created_at: "2026-02-17T00:00:00Z",
  updated_at: "2026-02-17T00:00:00Z",
};

const AGENTS_FIXTURE = {
  agents: [
    {
      id: "agent-director",
      team_id: "team-1",
      name: "content_director",
      role: "Director",
      layer: "orchestration",
      model: "sonnet",
      prompt_template: null,
      tools: [],
      sort_order: 0,
      status: "idle",
      created_at: "2026-02-17T00:00:00Z",
      updated_at: "2026-02-17T00:00:00Z",
    },
    {
      id: "agent-writer",
      team_id: "team-1",
      name: "blog_writer",
      role: "Writer",
      layer: "execution",
      model: "haiku",
      prompt_template: null,
      tools: [],
      sort_order: 1,
      status: "idle",
      created_at: "2026-02-17T00:00:00Z",
      updated_at: "2026-02-17T00:00:00Z",
    },
  ],
  total: 2,
};

function renderTeamDetailPage() {
  return render(<TeamDetailPage params={Promise.resolve({ id: "team-1" })} />);
}

describe("TeamDetailPage", () => {
  beforeEach(() => {
    vi.mocked(getTeamById).mockResolvedValue(TEAM_FIXTURE);
    vi.mocked(listAgents).mockResolvedValue(AGENTS_FIXTURE);
  });

  it("초기 로드 시 팀 정보와 에이전트 조직도를 표시한다", async () => {
    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "마케팅 팀" })).toBeInTheDocument();
    });

    expect(screen.getByText("콘텐츠 자동화 팀")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "에이전트 조직도" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "content_director" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "최근 작업" })).toBeInTheDocument();
  });

  it("에이전트 클릭 시 상세 패널 정보를 갱신한다", async () => {
    const user = userEvent.setup();

    renderTeamDetailPage();

    const targetAgentButton = await screen.findByRole("button", { name: "blog_writer" });
    await user.click(targetAgentButton);

    expect(screen.getByRole("heading", { name: "blog_writer" })).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
  });

  it("새 작업 요청 버튼은 작업 요청 화면 링크로 표시된다", async () => {
    renderTeamDetailPage();

    const link = await screen.findByRole("link", { name: "새 작업 요청" });
    expect(link).toHaveAttribute("href", "/teams/team-1/tasks/new");
    expect(screen.getByText("URL 또는 파일 기반 작업을 3단계로 요청합니다.")).toBeInTheDocument();
  });

  it("팀 설정 버튼을 표시한다", async () => {
    renderTeamDetailPage();

    const settingsButton = await screen.findByRole("button", { name: "팀 설정" });
    expect(settingsButton).toBeInTheDocument();
  });
});
