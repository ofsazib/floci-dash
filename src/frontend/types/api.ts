export interface HealthResponse {
  services: Record<string, "running" | "available">;
  edition: string;
  original_edition: string;
  version: string;
  stats: { total: number; running: number; available: number };
}

export interface InitResponse {
  completed: {
    boot: boolean;
    start: boolean;
    ready: boolean;
    shutdown: boolean;
  };
  scripts: Record<string, Array<{
    script: string;
    state: string;
    return_code: number;
  }>>;
}

export interface ResourceSummary {
  id: string;
  name: string;
  arn?: string;
  created?: string;
}

export interface ResourceListResponse {
  service: string;
  resources: ResourceSummary[];
  count: number;
}
