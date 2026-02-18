import { authLib } from "@/lib/auth";
import type {
  Task,
  TaskCreateInput,
  TaskListResponse,
  TaskLogListResponse,
  TaskResultListResponse,
} from "@/types/task";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authLib.getAuthHeader(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    authLib.removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return response;
}

async function getErrorDetail(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return fallback;
  }

  const payload = (await response.json()) as { detail?: unknown };
  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  return fallback;
}

export async function createTask(teamId: string, input: TaskCreateInput): Promise<Task> {
  const response = await fetchWithAuth(`/api/v1/teams/${teamId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to create task");
    throw new Error(detail);
  }

  return response.json();
}

export async function listTasks(params?: {
  teamId?: string;
  status?: string;
  type?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
}): Promise<TaskListResponse> {
  const query = new URLSearchParams();
  if (params?.teamId) {
    query.set("team_id", params.teamId);
  }
  if (params?.status) {
    query.set("status", params.status);
  }
  if (params?.type) {
    query.set("type", params.type);
  }
  if (params?.createdFrom) {
    query.set("created_from", params.createdFrom);
  }
  if (params?.createdTo) {
    query.set("created_to", params.createdTo);
  }
  if (typeof params?.page === "number") {
    query.set("page", String(params.page));
  }
  if (typeof params?.limit === "number") {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString();
  const path = suffix.length > 0 ? `/api/v1/tasks?${suffix}` : "/api/v1/tasks";

  const response = await fetchWithAuth(path);
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load tasks");
    throw new Error(detail);
  }

  return response.json();
}

export async function getTask(taskId: string): Promise<Task> {
  const response = await fetchWithAuth(`/api/v1/tasks/${taskId}`);
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load task");
    throw new Error(detail);
  }

  return response.json();
}

export async function cancelTask(taskId: string): Promise<Task> {
  const response = await fetchWithAuth(`/api/v1/tasks/${taskId}/cancel`, {
    method: "PUT",
  });
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to cancel task");
    throw new Error(detail);
  }

  return response.json();
}

export async function listTaskLogs(taskId: string): Promise<TaskLogListResponse> {
  const response = await fetchWithAuth(`/api/v1/tasks/${taskId}/logs`);
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load task logs");
    throw new Error(detail);
  }

  return response.json();
}

export async function listTaskResults(taskId: string, resultType?: string): Promise<TaskResultListResponse> {
  const query = new URLSearchParams();
  if (resultType) {
    query.set("result_type", resultType);
  }

  const suffix = query.toString();
  const path =
    suffix.length > 0
      ? `/api/v1/tasks/${taskId}/results?${suffix}`
      : `/api/v1/tasks/${taskId}/results`;

  const response = await fetchWithAuth(path);
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load task results");
    throw new Error(detail);
  }

  return response.json();
}

function resolveDownloadFileName(response: Response, resultId: string): string {
  const header = response.headers.get("content-disposition") ?? "";
  const matched = header.match(/filename="?([^\"]+)"?/i);
  if (matched?.[1]) {
    return matched[1];
  }

  return `task-result-${resultId}.txt`;
}

export async function downloadTaskResult(taskId: string, resultId: string): Promise<void> {
  const response = await fetchWithAuth(`/api/v1/tasks/${taskId}/results/${resultId}/download`);
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to download task result");
    throw new Error(detail);
  }

  if (typeof window === "undefined") {
    return;
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = resolveDownloadFileName(response, resultId);
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}
