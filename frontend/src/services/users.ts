import { authLib } from "@/lib/auth";
import type { UserProfile, UserProfileUpdateInput } from "@/types/user";

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

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const response = await fetchWithAuth("/api/v1/users/me");
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load user profile");
    throw new Error(detail);
  }

  return response.json();
}

export async function updateCurrentUserProfile(input: UserProfileUpdateInput): Promise<UserProfile> {
  const response = await fetchWithAuth("/api/v1/users/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to update user profile");
    throw new Error(detail);
  }

  return response.json();
}

export interface UserPreferences {
  notifications: {
    task_completed: boolean;
    task_failed: boolean;
  };
  theme: string;
}

export interface UserPreferencesUpdate {
  notifications?: {
    task_completed?: boolean;
    task_failed?: boolean;
  };
  theme?: string;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const response = await fetchWithAuth("/api/v1/users/me/preferences");
  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to load user preferences");
    throw new Error(detail);
  }

  return response.json();
}

export async function updateUserPreferences(input: UserPreferencesUpdate): Promise<UserPreferences> {
  const response = await fetchWithAuth("/api/v1/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await getErrorDetail(response, "Failed to update user preferences");
    throw new Error(detail);
  }

  return response.json();
}
