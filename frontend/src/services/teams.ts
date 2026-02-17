import { authLib } from "@/lib/auth";
import type { Team, TeamCreateInput, TeamListResponse } from "@/types/team";

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

export async function listTeams(): Promise<TeamListResponse> {
  const response = await fetchWithAuth("/api/v1/teams");

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load teams");
    throw new Error(detail);
  }

  return response.json();
}

export async function getTeamById(teamId: string): Promise<Team> {
  const response = await fetchWithAuth(`/api/v1/teams/${teamId}`);

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load team details");
    throw new Error(detail);
  }

  return response.json();
}

export async function createTeam(input: TeamCreateInput): Promise<Team> {
  const response = await fetchWithAuth("/api/v1/teams", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to create team");
    throw new Error(detail);
  }

  return response.json();
}
