import { authLib } from "@/lib/auth";
import type { TemplateListResponse } from "@/types/template";

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

export async function listTemplates(): Promise<TemplateListResponse> {
  const response = await fetchWithAuth("/api/v1/templates");

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load templates");
    throw new Error(detail);
  }

  return response.json();
}
