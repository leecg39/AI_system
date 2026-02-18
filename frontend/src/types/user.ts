export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  api_usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdateInput {
  name: string;
}
