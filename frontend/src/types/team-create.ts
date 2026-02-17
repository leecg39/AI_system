import type { AgentLayer, AgentModel } from "@/types/agent";

export interface AgentDraft {
  id: string;
  name: string;
  role: string;
  layer: AgentLayer;
  model: AgentModel;
  prompt_template: string;
}
