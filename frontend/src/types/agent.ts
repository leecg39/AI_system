export type AgentLayer = "orchestration" | "research" | "execution" | "quality" | string;
export type AgentModel = "opus" | "sonnet" | "haiku" | string;
export type AgentStatus = "idle" | "running" | "completed" | "failed" | string;

export interface Agent {
  id: string;
  team_id: string;
  name: string;
  role: string;
  layer: AgentLayer;
  model: AgentModel;
  prompt_template: string | null;
  tools: string[];
  sort_order: number;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
}

export interface AgentCreateInput {
  name: string;
  role: string;
  layer: AgentLayer;
  model?: AgentModel;
  prompt_template?: string;
  tools?: string[];
  sort_order?: number;
}
