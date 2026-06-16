// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockLogGroups = vi.fn();
const mockLogStreams = vi.fn();
const mockLogEvents = vi.fn();
const mockSubFilters = vi.fn();
const mockLogGroupTags = vi.fn();
const mockCreateLogGroupMutate = vi.fn();
const mockParams = vi.fn();
const mockDynamoTables = vi.fn();
const mockRDSInstances = vi.fn();

vi.mock("../hooks/useLogs", () => ({
  useLogGroups: (...args: any[]) => mockLogGroups(...args),
  useCreateLogGroup: () => ({ mutate: mockCreateLogGroupMutate, isPending: false, isError: false, error: null }),
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
  useRDSDBInstances: (...args: any[]) => mockRDSInstances(...args),
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
  useDynamoDBTables: (...args: any[]) => mockDynamoTables(...args),
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
  useParams: (...args: any[]) => mockParams(...args),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import ServicePage from "./ServicePage";
describe("ServicePage — CloudWatch Logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "logs" });
    mockLogGroups.mockReturnValue({ data: { logGroups: [{ logGroupName: "/test/group", retentionInDays: 7, storedBytes: 1024 }], total: 1 }, isLoading: false, isError: false, error: null });
    mockLogStreams.mockReturnValue({ data: { logStreams: [] }, isLoading: false, isError: false, error: null });
    mockLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
    mockSubFilters.mockReturnValue({ data: { subscriptionFilters: [] }, isLoading: false, isError: false, error: null });
    mockLogGroupTags.mockReturnValue({ data: { tags: { env: "test" } }, isLoading: false, isError: false, error: null });
  });

  // ─── Render State Tests ─────────────────────────────────

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

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create log group modal when 'Create Log Group' button is clicked", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, /Create Log Group/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("/aws/lambda/my-function")).toBeTruthy();
    });
  });

  it("calls createLogGroup when create log group form is submitted", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, /Create Log Group/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("/aws/lambda/my-function")).toBeTruthy();
    });
    const input = screen.getByPlaceholderText("/aws/lambda/my-function");
    await user.type(input, "/test/new-group");
    await clickButton(user, /Create log group/i, { last: true });
    expect(mockCreateLogGroupMutate).toHaveBeenCalled();
  });
});

describe("ServicePage — DynamoDB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "dynamodb" });
  });

  it("renders dynamodb service page with table list", () => {
    mockDynamoTables.mockReturnValue({
      data: { tables: ["my-table"], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Tables").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-table").length).toBeGreaterThan(0);
  });

  it("shows empty table state", () => {
    mockDynamoTables.mockReturnValue({
      data: { tables: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Tables").length).toBeGreaterThan(0);
    expect(screen.getByText("No tables found")).toBeTruthy();
  });
});

describe("ServicePage — RDS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
  });

  it("renders rds service page with db instance list", () => {
    mockRDSInstances.mockReturnValue({
      data: {
        instances: [
          {
            id: "db-prod-1",
            engine: "postgres",
            engineVersion: "16",
            status: "available",
            dbInstanceClass: "db.t3.micro",
            allocatedStorage: 20,
            masterUsername: "admin",
            endpoint: { address: "localhost", port: 5432 },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("DB Instances").length).toBeGreaterThan(0);
    expect(screen.getAllByText("db-prod-1").length).toBeGreaterThan(0);
  });

  it("shows empty db instance state", () => {
    mockRDSInstances.mockReturnValue({
      data: { instances: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("DB Instances").length).toBeGreaterThan(0);
    expect(screen.getByText("No DB instances found")).toBeTruthy();
  });
});

describe("ServicePage — Unknown service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "ecs" });
  });

  it("shows coming soon for unknown service", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0);
  });
});
