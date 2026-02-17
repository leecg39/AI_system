import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import DashboardPage from "@/app/(main)/dashboard/page";
import { listTeams } from "@/services/teams";
import { getDashboardStats } from "@/services/dashboard";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/services/teams", () => ({
  listTeams: vi.fn(),
}));

vi.mock("@/services/dashboard", () => ({
  getDashboardStats: vi.fn(),
}));

const mockPush = vi.fn();

describe("DashboardPage", () => {
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
    vi.mocked(getDashboardStats).mockResolvedValue({
      running_tasks: 3,
      completed_tasks_today: 7,
      total_teams: 2,
    });
  });

  it("초기 로드 시 요약 카드와 조직도를 표시한다", async () => {
    vi.mocked(listTeams).mockResolvedValue({
      teams: [
        {
          id: "team-marketing",
          user_id: "user-1",
          name: "마케팅 팀",
          description: "marketing",
          template_id: null,
          config: {},
          status: "active",
          agent_count: 5,
          recent_task_count: 2,
          created_at: "2026-02-17T00:00:00Z",
          updated_at: "2026-02-17T00:00:00Z",
        },
      ],
      total: 1,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "오늘의 요약" })).toBeInTheDocument();
    });

    expect(screen.getByText("진행 중 작업")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("오늘 완료")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("전체 팀")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "팀 조직도" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "마케팅 팀" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 팀 만들기" })).toHaveAttribute("href", "/teams/new");
  });

  it("팀 클릭 시 팀 상세 페이지로 이동한다", async () => {
    const user = userEvent.setup();

    vi.mocked(listTeams).mockResolvedValue({
      teams: [
        {
          id: "team-finance",
          user_id: "user-1",
          name: "재무 팀",
          description: "finance",
          template_id: null,
          config: {},
          status: "active",
          agent_count: 4,
          recent_task_count: 1,
          created_at: "2026-02-17T00:00:00Z",
          updated_at: "2026-02-17T00:00:00Z",
        },
      ],
      total: 1,
    });

    render(<DashboardPage />);

    const teamButton = await screen.findByRole("button", { name: "재무 팀" });
    await user.click(teamButton);

    expect(mockPush).toHaveBeenCalledWith("/teams/team-finance");
  });

  it("팀이 없으면 빈 상태와 강조된 생성 버튼을 표시한다", async () => {
    vi.mocked(listTeams).mockResolvedValue({
      teams: [],
      total: 0,
    });

    render(<DashboardPage />);

    const emptyTitle = await screen.findByText("첫 번째 AI 팀을 만들어보세요");
    expect(emptyTitle).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();

    const createLinks = screen.getAllByRole("link", { name: "새 팀 만들기" });
    expect(createLinks[0]).toHaveAttribute("href", "/teams/new");
  });
});
