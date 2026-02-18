import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/(main)/settings/page";
import { listTasks } from "@/services/tasks";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/services/users";

vi.mock("@/services/users", () => ({
  getCurrentUserProfile: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
}));

vi.mock("@/services/tasks", () => ({
  listTasks: vi.fn(),
}));

const USER_FIXTURE = {
  id: "user-1",
  email: "owner@example.com",
  name: "홍길동",
  plan: "pro",
  api_usage_count: 42,
  created_at: "2026-02-18T00:00:00Z",
  updated_at: "2026-02-18T00:00:00Z",
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserProfile).mockResolvedValue(USER_FIXTURE);
    vi.mocked(updateCurrentUserProfile).mockResolvedValue({
      ...USER_FIXTURE,
      name: "김설정",
    });
    vi.mocked(listTasks).mockResolvedValue({
      tasks: [],
      total: 0,
      page: 1,
      limit: 100,
    });

    window.localStorage.clear();
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:task-history"),
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("초기 로드 시 설정 섹션과 구독 정보를 표시한다", async () => {
    render(<SettingsPage />);

    await screen.findByTestId("settings-page");

    expect(screen.getByTestId("profile-section")).toBeInTheDocument();
    expect(screen.getByTestId("api-key-section")).toBeInTheDocument();
    expect(screen.getByTestId("subscription-section")).toBeInTheDocument();
    expect(screen.getByTestId("notification-section")).toBeInTheDocument();
    expect(screen.getByTestId("data-management-section")).toBeInTheDocument();

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("42 회")).toBeInTheDocument();
  });

  it("프로필 저장 시 users/me PATCH를 호출한다", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByTestId("settings-page");

    const nameInput = screen.getByLabelText("이름");
    await user.clear(nameInput);
    await user.type(nameInput, "김설정");
    await user.click(screen.getByRole("button", { name: "프로필 저장" }));

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({ name: "김설정" });
    });

    expect(await screen.findByText("프로필이 저장되었습니다.")).toBeInTheDocument();
  });

  it("API 키 저장 시 마스킹된 값이 표시된다", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByTestId("settings-page");

    await user.type(screen.getByLabelText("Claude API Key"), "sk-ant-test-1234567890");
    await user.click(screen.getByRole("button", { name: "API 키 저장" }));

    expect(screen.getByText("API 키가 마스킹되어 저장되었습니다.")).toBeInTheDocument();
    expect(screen.getByText(/저장된 키:/)).toBeInTheDocument();
    expect(window.localStorage.getItem("clabs.settings.apiKey")).toBe("sk-ant-test-1234567890");
  });

  it("알림 저장/이력 내보내기/삭제 동작을 처리한다", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByTestId("settings-page");

    await user.click(screen.getByLabelText("주간 리포트 알림"));
    await user.click(screen.getByRole("button", { name: "알림 설정 저장" }));
    expect(await screen.findByText("알림 설정이 저장되었습니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "작업 이력 내보내기" }));
    await waitFor(() => {
      expect(listTasks).toHaveBeenCalledWith({ page: 1, limit: 100 });
    });
    expect(await screen.findByText("작업 이력을 JSON 파일로 내보냈습니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "작업 이력 삭제" }));
    expect(await screen.findByText(/로컬 이력 캐시를 삭제했습니다/)).toBeInTheDocument();
  });
});
