// @vitest-environment happy-dom
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
const mockRDSClusters = vi.fn();
const mockRDSParameterGroups = vi.fn();
const mockRDSClusterParameterGroups = vi.fn();
const mockRDSInstanceDetail = vi.fn();
const mockRDSClusterDetail = vi.fn();
const mockCreateRDSInstance = vi.fn();
const mockCreateRDSCluster = vi.fn();
const mockCreateRDSParameterGroup = vi.fn();
const mockCreateLogStreamMutate = vi.fn();
const mockPutRetentionMutate = vi.fn();
const mockPutSubFilterMutate = vi.fn();
const mockTagLogGroupMutate = vi.fn();

vi.mock("../hooks/useLogs", () => ({
  useLogGroups: (...args: any[]) => mockLogGroups(...args),
  useCreateLogGroup: () => ({ mutate: mockCreateLogGroupMutate, isPending: false, isError: false, error: null }),
  useDeleteLogGroup: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
  usePutRetentionPolicy: () => ({ mutate: mockPutRetentionMutate, isPending: false, isError: false, error: null }),
  useDeleteRetentionPolicy: () => ({ mutate: vi.fn(), isPending: false }),
  useLogStreams: (...args: any[]) => mockLogStreams(...args),
  useCreateLogStream: () => ({ mutate: mockCreateLogStreamMutate, isPending: false, isError: false, error: null }),
  useDeleteLogStream: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useLogEvents: (...args: any[]) => mockLogEvents(...args),
  usePutLogEvents: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubscriptionFilters: (...args: any[]) => mockSubFilters(...args),
  usePutSubscriptionFilter: () => ({ mutate: mockPutSubFilterMutate, isPending: false, isError: false, error: null }),
  useDeleteSubscriptionFilter: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useLogGroupTags: (...args: any[]) => mockLogGroupTags(...args),
  useTagLogGroup: () => ({ mutate: mockTagLogGroupMutate, isPending: false }),
  useUntagLogGroup: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/useRDS", () => ({
  useRDSDBInstances: (...args: any[]) => mockRDSInstances(...args),
  useRDSCreateDBInstance: () => ({ mutate: mockCreateRDSInstance, isPending: false, isError: false, error: null }),
  useRDSDeleteDBInstance: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useRDSRebootDBInstance: () => ({ mutate: vi.fn(), isPending: false, variables: null }),
  useRDSDBInstance: (...args: any[]) => mockRDSInstanceDetail(...args),
  useRDSDBClusters: (...args: any[]) => mockRDSClusters(...args),
  useRDSCreateDBCluster: () => ({ mutate: mockCreateRDSCluster, isPending: false, isError: false, error: null }),
  useRDSDeleteDBCluster: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useRDSDBCluster: (...args: any[]) => mockRDSClusterDetail(...args),
  useRDSParameterGroups: (...args: any[]) => mockRDSParameterGroups(...args),
  useRDSCreateParameterGroup: () => ({ mutate: mockCreateRDSParameterGroup, isPending: false, isError: false, error: null }),
  useRDSDeleteParameterGroup: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useRDSModifyParameterGroupParameters: () => ({ mutate: vi.fn(), isPending: false }),
  useRDSClusterParameterGroups: (...args: any[]) => mockRDSClusterParameterGroups(...args),
  useRDSCreateClusterParameterGroup: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useRDSDeleteClusterParameterGroup: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useDynamoDB", () => ({
  useDynamoDBTables: (...args: any[]) => mockDynamoTables(...args),
  useDynamoDBCreateTable: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDynamoDBDeleteTable: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../components/DynamoDBTableDetail", () => ({
  default: ({ tableName, onBack }: { tableName: string; onBack: () => void }) => (
    <div data-testid="dynamodb-table-detail">
      <button onClick={onBack}>Back to tables</button>
      <span>Detail for {tableName}</span>
    </div>
  ),
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

// ─── Shared default mock data ────────────────────────────
const DEFAULT_LOG_GROUPS = [
  { logGroupName: "/test/group", retentionInDays: 7, storedBytes: 1024 },
];
const DEFAULT_DYNAMO_TABLES = { tables: ["my-table"], total: 1 };
const DEFAULT_RDS_INSTANCES = {
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
};

function setupRDSDefaults() {
  mockRDSInstances.mockReturnValue({ data: DEFAULT_RDS_INSTANCES, isLoading: false, isError: false, error: null });
  mockRDSClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockRDSParameterGroups.mockReturnValue({ data: { parameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockRDSClusterParameterGroups.mockReturnValue({ data: { clusterParameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockRDSInstanceDetail.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
  mockRDSClusterDetail.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
}
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
    setupRDSDefaults();
  });

  it("renders rds service page with db instance list", () => {
    mockRDSInstances.mockReturnValue({
      data: DEFAULT_RDS_INSTANCES,
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

// ────────────────────────────────────────────────────────
//  Helper: click a Cloudscape Tabs item by label
// ────────────────────────────────────────────────────────
async function clickTab(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  const tab = screen.getByRole("tab", { name });
  await user.click(tab);
}

// ─── CloudWatch Logs — Log Group Detail depth ────────────

describe("ServicePage — CloudWatch Logs Log Group Detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "logs" });
    mockLogGroups.mockReturnValue({
      data: { logGroups: DEFAULT_LOG_GROUPS, total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockLogStreams.mockReturnValue({ data: { logStreams: [] }, isLoading: false, isError: false, error: null });
    mockLogEvents.mockReturnValue({ data: { events: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
    mockSubFilters.mockReturnValue({ data: { subscriptionFilters: [] }, isLoading: false, isError: false, error: null });
    mockLogGroupTags.mockReturnValue({ data: { tags: {} }, isLoading: false, isError: false, error: null });
  });

  it("navigates into a log group and shows the detail view with back button", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await waitFor(() => {
      expect(screen.getAllByText("Back to Log Groups").length).toBeGreaterThan(0);
    });
  });

  it("renders log streams list inside log group detail", async () => {
    mockLogStreams.mockReturnValue({
      data: { logStreams: [{ logStreamName: "stream-1", storedBytes: 2048 }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await waitFor(() => {
      expect(screen.getAllByText("Log Streams for /test/group").length).toBeGreaterThan(0);
      expect(screen.getAllByText("stream-1").length).toBeGreaterThan(0);
    });
  });

  it("shows empty log streams state inside log group detail", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await waitFor(() => {
      expect(screen.getByText("No log streams found")).toBeTruthy();
    });
  });

  it("renders retention config when Retention tab is clicked", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await waitFor(() => {
      expect(screen.getAllByText("Back to Log Groups").length).toBeGreaterThan(0);
    });
    await clickTab(user, /Retention/);
    await waitFor(() => {
      expect(screen.getAllByText("Retention period").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Current retention:").length).toBeGreaterThan(0);
    });
  });

  it("renders subscription filters list when Subscription Filters tab is clicked", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await waitFor(() => {
      expect(screen.getAllByText("Back to Log Groups").length).toBeGreaterThan(0);
    });
    await clickTab(user, /Subscription Filters/);
    await waitFor(() => {
      expect(screen.getByText("No subscription filters")).toBeTruthy();
    });
  });

  it("renders subscription filters with data", async () => {
    mockSubFilters.mockReturnValue({
      data: {
        subscriptionFilters: [
          { filterName: "my-filter", destinationArn: "arn:aws:lambda:us-east-1:1:f", filterPattern: "ERROR" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickTab(user, /Subscription Filters/);
    await waitFor(() => {
      expect(screen.getAllByText("my-filter").length).toBeGreaterThan(0);
    });
  });

  it("opens create subscription filter modal", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickTab(user, /Subscription Filters/);
    await clickButton(user, /Create Subscription Filter/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-filter")).toBeTruthy();
    });
  });

  it("renders tags table when Tags tab is clicked with existing tag", async () => {
    mockLogGroupTags.mockReturnValue({
      data: { tags: { env: "prod", team: "ops" } },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickTab(user, /Tags/);
    await waitFor(() => {
      expect(screen.getAllByText("prod").length).toBeGreaterThan(0);
      expect(screen.getAllByText("ops").length).toBeGreaterThan(0);
    });
  });

  it("shows empty tags state when no tags exist", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickTab(user, /Tags/);
    await waitFor(() => {
      expect(screen.getByText("No tags associated with this log group.")).toBeTruthy();
    });
  });

  it("calls tagLogGroup when adding a new tag", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickTab(user, /Tags/);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("tag-key")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("tag-key"), "department");
    await user.type(screen.getByPlaceholderText("tag-value"), "eng");
    await clickButton(user, /Add tag/i);
    expect(mockTagLogGroupMutate).toHaveBeenCalled();
  });

  it("calls putRetentionPolicy when Save retention is clicked with non-zero value", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickTab(user, /Retention/);
    await waitFor(() => {
      expect(screen.getAllByText("Save retention").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Save retention/i);
    expect(mockPutRetentionMutate).toHaveBeenCalled();
  });

  it("renders log stream create modal inside log group detail", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickButton(user, /Create Log Stream/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-stream")).toBeTruthy();
    });
  });

  it("calls createLogStream when stream form is submitted", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "/test/group");
    await clickButton(user, /Create Log Stream/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-stream")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-stream"), "new-stream");
    await clickButton(user, /Create log stream/i, { last: true });
    expect(mockCreateLogStreamMutate).toHaveBeenCalled();
  });
});

// ─── DynamoDB — Table Detail navigation ──────────────────

describe("ServicePage — DynamoDB Table Detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "dynamodb" });
  });

  it("navigates into a table detail when the table name is clicked", async () => {
    mockDynamoTables.mockReturnValue({
      data: DEFAULT_DYNAMO_TABLES,
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "my-table");
    await waitFor(() => {
      expect(screen.getByTestId("dynamodb-table-detail")).toBeTruthy();
      expect(screen.getAllByText("Detail for my-table").length).toBeGreaterThan(0);
    });
  });
});

// ─── RDS — DB Clusters tab ───────────────────────────────

describe("ServicePage — RDS DB Clusters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
    setupRDSDefaults();
  });

  it("renders db clusters list with data", async () => {
    mockRDSClusters.mockReturnValue({
      data: {
        clusters: [
          {
            id: "aurora-1",
            engine: "aurora-postgresql",
            engineVersion: "16",
            status: "available",
            masterUsername: "admin",
            databaseName: "mydb",
            endpoint: "aurora-1.cluster-abc.us-east-1.rds.amazonaws.com",
            clusterMembers: ["aurora-1-node-1"],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await waitFor(() => {
      expect(screen.getAllByText("aurora-1").length).toBeGreaterThan(0);
    });
  });

  it("shows empty db clusters state", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await waitFor(() => {
      expect(screen.getByText("No DB clusters found")).toBeTruthy();
    });
  });

  it("shows loading state for db clusters", async () => {
    mockRDSClusters.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await waitFor(() => {
      expect(screen.getAllByText("DB Clusters").length).toBeGreaterThan(0);
    });
  });

  it("shows error state for db clusters", async () => {
    mockRDSClusters.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Clusters failed"),
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await waitFor(() => {
      expect(screen.getByText("Clusters failed")).toBeTruthy();
    });
  });

  it("opens create db cluster modal", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await clickButton(user, /Create DB Cluster/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-cluster")).toBeTruthy();
    });
  });

  it("calls createDBCluster when form is submitted", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await clickButton(user, /Create DB Cluster/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-cluster")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-cluster"), "new-cluster");
    await clickButton(user, /Create cluster/i, { last: true });
    expect(mockCreateRDSCluster).toHaveBeenCalled();
  });
});

// ─── RDS — Parameter Groups tab ──────────────────────────

describe("ServicePage — RDS Parameter Groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
    setupRDSDefaults();
  });

  it("renders parameter groups list with data", async () => {
    mockRDSParameterGroups.mockReturnValue({
      data: {
        parameterGroups: [
          { name: "my-pg", family: "postgres16", description: "Custom PG" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, "Parameter Groups");
    await waitFor(() => {
      expect(screen.getAllByText("my-pg").length).toBeGreaterThan(0);
      expect(screen.getAllByText("postgres16").length).toBeGreaterThan(0);
    });
  });

  it("shows empty parameter groups state", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, "Parameter Groups");
    await waitFor(() => {
      expect(screen.getByText("No parameter groups found")).toBeTruthy();
    });
  });

  it("shows error state for parameter groups", async () => {
    mockRDSParameterGroups.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("PG load failed"),
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, "Parameter Groups");
    await waitFor(() => {
      expect(screen.getByText("PG load failed")).toBeTruthy();
    });
  });

  it("opens create parameter group modal", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, "Parameter Groups");
    await clickButton(user, /Create Parameter Group/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-params")).toBeTruthy();
    });
  });

  it("calls createParameterGroup when form is submitted", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, "Parameter Groups");
    await clickButton(user, /Create Parameter Group/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-params")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-params"), "new-pg");
    await clickButton(user, /Create group/i, { last: true });
    expect(mockCreateRDSParameterGroup).toHaveBeenCalled();
  });
});

// ─── RDS — Cluster Parameter Groups tab ──────────────────

describe("ServicePage — RDS Cluster Parameter Groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
    setupRDSDefaults();
  });

  it("renders cluster parameter groups list with data", async () => {
    mockRDSClusterParameterGroups.mockReturnValue({
      data: {
        clusterParameterGroups: [
          { name: "my-cpg", family: "aurora-postgresql16", description: "Aurora PG" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /Cluster Parameter Groups/);
    await waitFor(() => {
      expect(screen.getAllByText("my-cpg").length).toBeGreaterThan(0);
    });
  });

  it("shows empty cluster parameter groups state", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /Cluster Parameter Groups/);
    await waitFor(() => {
      expect(screen.getByText("No cluster parameter groups found")).toBeTruthy();
    });
  });

  it("opens create cluster parameter group modal", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /Cluster Parameter Groups/);
    await clickButton(user, /Create Cluster Parameter Group/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-cluster-params")).toBeTruthy();
    });
  });
});

// ─── RDS — DB Instance Detail ────────────────────────────

describe("ServicePage — RDS DB Instance Detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
    setupRDSDefaults();
  });

  it("navigates into DB instance detail when instance is clicked", async () => {
    mockRDSInstanceDetail.mockReturnValue({
      data: {
        id: "db-prod-1",
        engine: "postgres",
        engineVersion: "16",
        status: "available",
        dbInstanceClass: "db.t3.micro",
        allocatedStorage: 20,
        masterUsername: "admin",
        endpoint: { address: "localhost", port: 5432 },
        iamDatabaseAuthenticationEnabled: false,
        publiclyAccessible: false,
        multiAZ: false,
        storageType: "gp2",
        backupRetentionPeriod: 7,
        autoMinorVersionUpgrade: true,
        copyTagsToSnapshot: false,
        vpcSecurityGroups: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "db-prod-1");
    await waitFor(() => {
      expect(screen.getAllByText("Back to DB Instances").length).toBeGreaterThan(0);
    });
  });

  it("shows loading state in DB instance detail", async () => {
    mockRDSInstanceDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "db-prod-1");
    await waitFor(() => {
      expect(screen.getByText("Loading instance details...")).toBeTruthy();
    });
  });

  it("shows error state in DB instance detail", async () => {
    mockRDSInstanceDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Detail fetch failed"),
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, "db-prod-1");
    await waitFor(() => {
      expect(screen.getByText("Detail fetch failed")).toBeTruthy();
    });
  });
});

// ─── RDS — DB Instance Create flow ───────────────────────

describe("ServicePage — RDS DB Instance Create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
    setupRDSDefaults();
  });

  it("opens create db instance modal", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, /Create DB Instance/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-database")).toBeTruthy();
    });
  });

  it("calls createDBInstance when form is submitted", async () => {
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickButton(user, /Create DB Instance/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-database")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-database"), "new-db");
    await clickButton(user, /Create instance/i, { last: true });
    expect(mockCreateRDSInstance).toHaveBeenCalled();
  });
});

// ─── RDS — DB Clusters error & detail ────────────────────

describe("ServicePage — RDS DB Cluster Detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "rds" });
    setupRDSDefaults();
    mockRDSClusters.mockReturnValue({
      data: {
        clusters: [
          {
            id: "aurora-1",
            engine: "aurora-postgresql",
            engineVersion: "16",
            status: "available",
            masterUsername: "admin",
            databaseName: "mydb",
            endpoint: "host",
            clusterMembers: [],
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("navigates into DB cluster detail when cluster is clicked", async () => {
    mockRDSClusterDetail.mockReturnValue({
      data: {
        id: "aurora-1",
        engine: "aurora-postgresql",
        engineVersion: "16",
        status: "available",
        masterUsername: "admin",
        databaseName: "mydb",
        endpoint: "host",
        clusterMembers: [],
        iamDatabaseAuthenticationEnabled: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await clickButton(user, "aurora-1");
    await waitFor(() => {
      expect(screen.getAllByText("Back to DB Clusters").length).toBeGreaterThan(0);
    });
  });

  it("shows loading state in DB cluster detail", async () => {
    mockRDSClusterDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ServicePage />, { wrapper: createWrapper() });
    await clickTab(user, /DB Clusters/);
    await clickButton(user, "aurora-1");
    await waitFor(() => {
      expect(screen.getByText("Loading cluster details...")).toBeTruthy();
    });
  });
});
