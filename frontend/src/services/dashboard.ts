import { authLib } from "@/lib/auth";
import type { DashboardStats } from "@/types/dashboard";

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

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetchWithAuth("/api/v1/dashboard/stats");

  if (!response.ok) {
    let detail = "Failed to load dashboard stats";
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        detail = payload.detail;
      }
    }
    throw new Error(detail);
  }

  return response.json();
}
