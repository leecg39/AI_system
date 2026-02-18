export type TeamStatus = "active" | "paused" | "archived" | string;

export interface Team {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  config: Record<string, unknown>;
  status: TeamStatus;
  agent_count: number;
  recent_task_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamListResponse {
  teams: Team[];
  total: number;
}

export interface TeamCreateInput {
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  template_id?: string;
}
