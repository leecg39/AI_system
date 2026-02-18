export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | string;
export type TaskLogStatus = "started" | "processing" | "completed" | "error" | string;

export interface Task {
  id: string;
  team_id: string;
  user_id: string;
  type: string;
  input: Record<string, unknown>;
  options: Record<string, unknown>;
  status: TaskStatus;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  team_name: string;
  duration: string | null;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskCreateInput {
  type: string;
  input?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface TaskLog {
  id: string;
  task_id: string;
  agent_id: string;
  status: TaskLogStatus;
  message: string;
  progress: number;
  created_at: string;
}

export interface TaskLogListResponse {
  logs: TaskLog[];
  total: number;
}

export interface TaskResult {
  id: string;
  task_id: string;
  agent_id: string;
  result_type: string;
  content: string;
  file_url: string | null;
  metadata: Record<string, unknown>;
  quality_score: number | null;
  version: number;
  created_at: string;
}

export interface TaskResultListResponse {
  results: TaskResult[];
  total: number;
}
