import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import TaskMonitorPage from "@/app/(main)/tasks/[id]/monitor/page";
import { authLib } from "@/lib/auth";
import { listAgents } from "@/services/agents";
import { cancelTask, getTask, listTaskLogs } from "@/services/tasks";

vi.mock("@/lib/auth", () => ({
  authLib: {
    getToken: vi.fn(),
    removeToken: vi.fn(),
    getAuthHeader: vi.fn(() => ({})),
    setToken: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

vi.mock("@/services/agents", () => ({
  listAgents: vi.fn(),
}));

vi.mock("@/services/tasks", () => ({
  getTask: vi.fn(),
  cancelTask: vi.fn(),
  listTaskLogs: vi.fn(),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  sentPayloads: string[];

  constructor(url: string) {
    this.url = url;
    this.readyState = 0;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.sentPayloads = [];
    MockWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sentPayloads.push(payload);
  }

  close() {
    this.readyState = 3;
    this.onclose?.({} as CloseEvent);
  }

  emitOpen() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  emitMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
  }
}

const ORIGINAL_WEBSOCKET = globalThis.WebSocket;

const TASK_RUNNING = {
  id: "task-1",
  team_id: "team-1",
  user_id: "user-1",
  type: "content",
  input: {},
  options: {},
  status: "running",
  progress: 10,
  started_at: "2026-02-18T00:00:00Z",
  completed_at: null,
  created_at: "2026-02-18T00:00:00Z",
  team_name: "마케팅 팀",
  duration: null,
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

const LOGS_FIXTURE = {
  logs: [
    {
      id: "log-1",
      task_id: "task-1",
      agent_id: "agent-1",
      status: "started",
      message: "content_director started",
      progress: 10,
      created_at: "2026-02-18T00:00:01Z",
    },
  ],
  total: 1,
};

describe("Task monitor integration flow", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;

    vi.mocked(authLib.getToken).mockReturnValue("token-abc");
    vi.mocked(getTask).mockResolvedValue(TASK_RUNNING);
    vi.mocked(listAgents).mockResolvedValue(AGENTS_FIXTURE);
    vi.mocked(listTaskLogs).mockResolvedValue(LOGS_FIXTURE);
    vi.mocked(cancelTask).mockResolvedValue({
      ...TASK_RUNNING,
      status: "cancelled",
      progress: 10,
      completed_at: "2026-02-18T00:00:10Z",
    });
  });

  afterEach(() => {
    globalThis.WebSocket = ORIGINAL_WEBSOCKET;
  });

  it("updates progress UI when websocket progress event arrives", async () => {
    render(createElement(TaskMonitorPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-monitor-page");

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const socket = MockWebSocket.instances[0];
    await act(async () => {
      socket.emitOpen();
      socket.emitMessage({
        type: "progress_update",
        task_id: "task-1",
        status: "running",
        progress: 70,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("70%")).toBeInTheDocument();
    });
  });

  it("cancels task and reflects cancelled status", async () => {
    const user = userEvent.setup();
    render(createElement(TaskMonitorPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-monitor-page");

    await user.click(await screen.findByRole("button", { name: "작업 취소" }));

    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith("task-1");
    });

    expect(await screen.findByText("상태: 취소됨")).toBeInTheDocument();
  });

  it("activates results link when completion event arrives", async () => {
    render(createElement(TaskMonitorPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-monitor-page");
    expect(screen.getByRole("button", { name: "결과물 보기" })).toBeDisabled();

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const socket = MockWebSocket.instances[0];
    await act(async () => {
      socket.emitOpen();
      socket.emitMessage({
        type: "progress_update",
        task_id: "task-1",
        status: "completed",
        progress: 100,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "결과물 보기" })).toHaveAttribute(
        "href",
        "/tasks/task-1/results",
      );
    });
  });

  it("shows error status icon and message when agent error event arrives", async () => {
    render(createElement(TaskMonitorPage, { params: Promise.resolve({ id: "task-1" }) }));

    await screen.findByTestId("task-monitor-page");

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const socket = MockWebSocket.instances[0];
    await act(async () => {
      socket.emitOpen();
      socket.emitMessage({
        type: "agent_update",
        task_id: "task-1",
        agent_id: "agent-1",
        status: "error",
        progress: 35,
        message: "요약 생성 중 오류가 발생했습니다.",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("오류")).toBeInTheDocument();
      expect(screen.getByText("요약 생성 중 오류가 발생했습니다.")).toBeInTheDocument();
    });
  });
});
