import type { AgentCreateInput } from "@/types/agent";

export interface TeamTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  default_agents: AgentCreateInput[];
  is_active: boolean;
}

export interface TemplateListResponse {
  templates: TeamTemplate[];
  total: number;
}
