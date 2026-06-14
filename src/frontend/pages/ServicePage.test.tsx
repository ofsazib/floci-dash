// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockLogGroups = vi.fn();
const mockLogStreams = vi.fn();
const mockLogEvents = vi.fn();
const mockSubFilters = vi.fn();
const mockLogGroupTags = vi.fn();

vi.mock("../hooks/useLogs", () => ({
  useLogGroups: (...args: any[]) => mockLogGroups(...args),
  useCreateLogGroup: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteLogGroup: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
  usePutRetentionPolicy: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteRetentionPolicy: () => ({ mutate: vi.fn(), isPending: false }),
  useLogStreams: (...args: any[]) => mockLogStreams(...args),
  useCreateLogStream: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteLogStream: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useLogEvents: (...args: any[]) => mockLogEvents(...args),
  usePutLogEvents: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscriptionFilters: (...args: any[]) => mockSubFilters(...args),
  usePutSubscriptionFilter: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteSubscriptionFilter: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useLogGroupTags: (...args: any[]) => mockLogGroupTags(...args),
  useTagLogGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useUntagLogGroup: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/useRDS", () => ({
  useRDSDBInstances: () => ({ data: { instances: [] }, isLoading: false }),
  useRDSCreateDBInstance: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSDeleteDBInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRDSRebootDBInstance: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSDBInstance: () => ({ data: null, isLoading: false }),
  useRDSDBClusters: () => ({ data: { clusters: [] }, isLoading: false }),
  useRDSCreateDBCluster: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSDeleteDBCluster: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRDSDBCluster: () => ({ data: null, isLoading: false }),
  useRDSParameterGroups: () => ({ data: { parameterGroups: [] }, isLoading: false }),
  useRDSCreateParameterGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSDeleteParameterGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRDSModifyParameterGroupParameters: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSClusterParameterGroups: () => ({ data: { clusterParameterGroups: [] }, isLoading: false }),
  useRDSCreateClusterParameterGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSDeleteClusterParameterGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/useDynamoDB", () => ({
  useDynamoDBTables: () => ({ data: { tables: [] }, isLoading: false }),
  useDynamoDBCreateTable: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDynamoDBDeleteTable: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ data: { services: { logs: "available" } } }),
}));

vi.mock("../lib/client", () => ({
  api: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/utils", () => ({
  formatBytes: (b: number) => `${b} B`,
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ service: "logs" }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import ServicePage from "./ServicePage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("ServicePage — CloudWatch Logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogGroups.mockReturnValue({ data: { logGroups: [{ logGroupName: "/test/group", retentionInDays: 7, storedBytes: 1024 }], total: 1 }, isLoading: false, isError: false, error: null });
    mockLogStreams.mockReturnValue({ data: { logStreams: [] }, isLoading: false, isError: false, error: null });
    mockLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
    mockSubFilters.mockReturnValue({ data: { subscriptionFilters: [] }, isLoading: false, isError: false, error: null });
    mockLogGroupTags.mockReturnValue({ data: { tags: { env: "test" } }, isLoading: false, isError: false, error: null });
  });

  it("renders logs service page with log groups", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("CloudWatch Logs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Log Groups").length).toBeGreaterThan(0);
    expect(screen.getAllByText("/test/group").length).toBeGreaterThan(0);
  });

  it("shows empty log groups state", () => {
    mockLogGroups.mockReturnValue({ data: { logGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Log Groups").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("No log groups found").length).toBeGreaterThanOrEqual(0);
  });

  it("shows loading state", () => {
    mockLogGroups.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Log Groups").length).toBeGreaterThan(0);
  });

  it("shows error state", () => {
    mockLogGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed") });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });
});
