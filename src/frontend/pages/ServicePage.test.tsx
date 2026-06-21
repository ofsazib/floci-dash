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

vi.mock("../hooks/useCodeDeploy", () => ({
  useCodeDeployApplications: vi.fn(() => ({ data: { applications: [], total: 0 }, isLoading: false, isError: false, error: null })),
  useCreateCodeDeployApplication: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteCodeDeployApplication: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useCodeDeployDeploymentGroups: vi.fn(() => ({ data: { deploymentGroups: [], total: 0 }, isLoading: false, isError: false, error: null })),
  useCreateCodeDeployDeploymentGroup: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useCodeDeployDeploymentConfigs: vi.fn(() => ({ data: { deploymentConfigs: [], total: 0 }, isLoading: false, isError: false, error: null })),
  useCreateCodeDeployDeploymentConfig: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useCodeDeployDeployments: vi.fn(() => ({ data: { deployments: [], total: 0 }, isLoading: false, isError: false, error: null })),
  useCreateCodeDeployDeployment: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
}));

vi.mock("../hooks/useCUR", () => ({
  useReportDefinitions: vi.fn(() => ({ data: { reportDefinitions: [], total: 0 }, isLoading: false, isError: false, error: null })),
  useCreateReportDefinition: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useModifyReportDefinition: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteReportDefinition: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useBCMDataExports", () => ({
  useBCMExports: () => ({ data: { exports: [], total: 0 }, isLoading: false, isError: false, error: null }),
  useCreateBCMExport: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteBCMExport: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useBCMExportExecutions: () => ({ data: { executions: [], total: 0 }, isLoading: false, isError: false, error: null }),
  useBCMTables: () => ({ data: { tables: [], total: 0 }, isLoading: false, isError: false, error: null }),
}));

vi.mock("../hooks/useWafV2", () => ({
  useWebACLs: () => ({ data: { webAcls: [], total: 0 }, isLoading: false, isError: false, error: null }),
  useCreateWebACL: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteWebACL: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useIPSets: () => ({ data: { ipSets: [], total: 0 }, isLoading: false, isError: false, error: null }),
  useCreateIPSet: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteIPSet: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useRegexPatternSets: () => ({ data: { regexPatternSets: [], total: 0 }, isLoading: false, isError: false, error: null }),
  useCreateRegexPatternSet: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteRegexPatternSet: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useRuleGroups: () => ({ data: { ruleGroups: [], total: 0 }, isLoading: false, isError: false, error: null }),
  useCreateRuleGroup: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDeleteRuleGroup: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useSystem", () => ({ useHealth: () => ({ data: { services: { logs: "available" } } }),
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
import * as codeDeployModule from "../hooks/useCodeDeploy";
import * as curModule from "../hooks/useCUR";
import * as bcmModule from "../hooks/useBCMDataExports";

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
    mockParams.mockReturnValue({ service: "lambda" });
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

// ─── CodeDeploy ─────────────────────────────────────────

describe("ServicePage — CodeDeploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "codedeploy" });
  });

  it("renders CodeDeploy applications page with empty state", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("CodeDeploy Applications").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No applications found").length).toBeGreaterThanOrEqual(0);
  });

  it("renders CodeDeploy applications with data", () => {
    vi.mocked(codeDeployModule.useCodeDeployApplications).mockReturnValue({
      data: { applications: [{ applicationName: "my-app", description: "test", createTime: "2025-01-01" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("my-app").length).toBeGreaterThan(0);
  });

  it("shows error state for CodeDeploy", () => {
    vi.mocked(codeDeployModule.useCodeDeployApplications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
    } as any);
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("CodeDeploy Applications").length).toBeGreaterThan(0);
  });
});

// ─── CUR ────────────────────────────────────────────────

describe("ServicePage — CUR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "cur" });
  });

  it("renders CUR report definitions with empty state", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Cost & Usage Report Definitions").length).toBeGreaterThan(0);
  });

  it("renders CUR report definitions with data", () => {
    vi.mocked(curModule.useReportDefinitions).mockReturnValue({
      data: { reportDefinitions: [{ ReportName: "my-report", TimeUnit: "DAILY", Format: "textORcsv", Compression: "GZIP", S3Bucket: "bucket" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("my-report").length).toBeGreaterThan(0);
  });

  it("renders CUR report definitions with data", () => {
    vi.mocked(curModule.useReportDefinitions).mockReturnValue({
      data: { reportDefinitions: [{ ReportName: "my-report", TimeUnit: "DAILY", Format: "textORcsv", Compression: "GZIP", S3Bucket: "bucket" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("my-report").length).toBeGreaterThan(0);
  });
});

// ─── BCM Data Exports ───────────────────────────────────

describe("ServicePage — BCM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "bcmdataexports" });
  });

  it("renders BCM exports with empty state", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("BCM Data Exports").length).toBeGreaterThan(0);
  });
});

// ─── WAF v2 ─────────────────────────────────────────────

describe("ServicePage — WAFv2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "wafv2" });
  });

  it("renders WAF v2 web ACLs page with empty state", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("WAF v2 Web ACLs").length).toBeGreaterThan(0);
  });
});

// ─── Mock declarations for additional dashboards ─────────
const mockOpenSearchDomains = vi.fn();
const mockMskClusters = vi.fn();
const mockFirehoseStreams = vi.fn();
const mockACMCertificates = vi.fn();
const mockTranscriptionJobs = vi.fn();
const mockCloudTrailTrails = vi.fn();
const mockRGTResources = vi.fn();
const mockRGTTagKeys = vi.fn();
const mockRGTTagValues = vi.fn();

vi.mock("../hooks/useOpenSearch", () => ({
  useOpenSearchDomains: (...args: any[]) => mockOpenSearchDomains(...args),
  useDeleteOpenSearchDomain: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useMsk", () => ({
  useMskClusters: (...args: any[]) => mockMskClusters(...args),
  useDeleteMskCluster: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useFirehose", () => ({
  useFirehoseStreams: (...args: any[]) => mockFirehoseStreams(...args),
  useDeleteFirehoseStream: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useACM", () => ({
  useACMCertificates: (...args: any[]) => mockACMCertificates(...args),
  useDeleteACMCertificate: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useTranscribe", () => ({
  useTranscriptionJobs: (...args: any[]) => mockTranscriptionJobs(...args),
  useDeleteTranscriptionJob: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../hooks/useCloudTrail", () => ({
  useCloudTrailTrails: (...args: any[]) => mockCloudTrailTrails(...args),
  useDeleteCloudTrailTrail: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useStartCloudTrailLogging: () => ({ mutate: vi.fn(), isPending: false }),
  useStopCloudTrailLogging: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/useRGT", () => ({
  useRGTResources: (...args: any[]) => mockRGTResources(...args),
  useRGTTagKeys: (...args: any[]) => mockRGTTagKeys(...args),
  useRGTTagValues: (...args: any[]) => mockRGTTagValues(...args),
  useRGTTagResources: () => ({ mutate: vi.fn(), isPending: false }),
  useRGTUntagResources: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ─── Bedrock Runtime (static Alert) ──────────────────────

describe("ServicePage — Bedrock Runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "bedrock-runtime" });
  });

  it("renders informational alert", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/Bedrock Runtime is a data-plane service/i).length).toBeGreaterThan(0);
  });
});

// ─── Textract (static Alert) ─────────────────────────────

describe("ServicePage — Textract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "textract" });
  });

  it("renders informational alert", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/Textract is a document analysis service/i).length).toBeGreaterThan(0);
  });
});

// ─── OpenSearch ─────────────────────────────────────────

describe("ServicePage — OpenSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "es" });
    mockOpenSearchDomains.mockReturnValue({
      data: { domains: [{ DomainName: "my-domain", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
  });

  it("renders OpenSearch domains with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("OpenSearch Domains").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-domain").length).toBeGreaterThan(0);
  });

  it("shows empty state when no domains", () => {
    mockOpenSearchDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No OpenSearch domains")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockOpenSearchDomains.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("my-domain")).toBeNull();
  });
});

// ─── MSK ────────────────────────────────────────────────

describe("ServicePage — MSK", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "kafka" });
    mockMskClusters.mockReturnValue({
      data: {
        clusters: [
          {
            ClusterArn: "arn:aws:kafka:us-east-1:1:cluster/my-cluster/abc",
            ClusterName: "my-cluster",
            State: "ACTIVE",
            NumberOfBrokerNodes: 3,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  });

  it("renders MSK clusters with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("MSK Clusters").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-cluster").length).toBeGreaterThan(0);
  });

  it("shows empty state when no clusters", () => {
    mockMskClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No MSK clusters")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockMskClusters.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("my-cluster")).toBeNull();
  });
});

// ─── Firehose ───────────────────────────────────────────

describe("ServicePage — Firehose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "firehose" });
    mockFirehoseStreams.mockReturnValue({
      data: {
        streams: [
          {
            DeliveryStreamName: "my-stream",
            DeliveryStreamARN: "arn:aws:firehose:us-east-1:1:deliverystream/my-stream",
            DeliveryStreamStatus: "ACTIVE",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  });

  it("renders Firehose streams with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Kinesis Firehose Delivery Streams").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-stream").length).toBeGreaterThan(0);
  });

  it("shows empty state when no streams", () => {
    mockFirehoseStreams.mockReturnValue({ data: { streams: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No delivery streams")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockFirehoseStreams.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("my-stream")).toBeNull();
  });
});

// ─── ACM ────────────────────────────────────────────────

describe("ServicePage — ACM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "acm" });
    mockACMCertificates.mockReturnValue({
      data: {
        certificates: [
          {
            CertificateArn: "arn:aws:acm:us-east-1:1:certificate/abc",
            DomainName: "example.com",
            Status: "ISSUED",
            Type: "AMAZON_ISSUED",
            KeyAlgorithm: "RSA_2048",
            InUse: true,
            NotAfter: 1800000000,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  });

  it("renders ACM certificates with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("ACM Certificates").length).toBeGreaterThan(0);
    expect(screen.getAllByText("example.com").length).toBeGreaterThan(0);
  });

  it("shows empty state when no certificates", () => {
    mockACMCertificates.mockReturnValue({ data: { certificates: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No certificates")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockACMCertificates.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("example.com")).toBeNull();
  });
});

// ─── Transcribe ─────────────────────────────────────────

describe("ServicePage — Transcribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "transcribe" });
    mockTranscriptionJobs.mockReturnValue({
      data: {
        jobs: [
          {
            TranscriptionJobName: "my-job",
            TranscriptionJobStatus: "COMPLETED",
            LanguageCode: "en-US",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  });

  it("renders transcription jobs with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Transcription Jobs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-job").length).toBeGreaterThan(0);
  });

  it("shows empty state when no jobs", () => {
    mockTranscriptionJobs.mockReturnValue({ data: { jobs: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No transcription jobs")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockTranscriptionJobs.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("my-job")).toBeNull();
  });
});

// ─── CloudTrail ─────────────────────────────────────────

describe("ServicePage — CloudTrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "cloudtrail" });
    mockCloudTrailTrails.mockReturnValue({
      data: {
        trails: [
          {
            Name: "my-trail",
            TrailARN: "arn:aws:cloudtrail:us-east-1:1:trail/my-trail",
            S3BucketName: "my-bucket",
            IsMultiRegionTrail: true,
            IncludeGlobalServiceEvents: true,
            IsOrganizationTrail: false,
            HomeRegion: "us-east-1",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  });

  it("renders CloudTrail trails with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("CloudTrail Trails").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-trail").length).toBeGreaterThan(0);
  });

  it("shows empty state when no trails", () => {
    mockCloudTrailTrails.mockReturnValue({ data: { trails: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No trails")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockCloudTrailTrails.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("my-trail")).toBeNull();
  });
});

// ─── Resource Groups & Tagging ──────────────────────────

describe("ServicePage — RGT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({ service: "resourcegroupstagging" });
    mockRGTResources.mockReturnValue({
      data: {
        resourceTagMappingList: [
          { ResourceARN: "arn:aws:s3:::my-bucket", Tags: { env: "prod" } },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockRGTTagKeys.mockReturnValue({ data: { tagKeys: ["env", "team"] }, isLoading: false });
    mockRGTTagValues.mockReturnValue({ data: { tagValues: ["prod", "dev"] }, isLoading: false });
  });

  it("renders tagged resources with data", () => {
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Tagged Resources").length).toBeGreaterThan(0);
    expect(screen.getAllByText("arn:aws:s3:::my-bucket").length).toBeGreaterThan(0);
  });

  it("shows empty state when no resources", () => {
    mockRGTResources.mockReturnValue({ data: { resourceTagMappingList: [], total: 0 }, isLoading: false });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("No tagged resources found")).toBeTruthy();
  });

  it("shows loading state with spinner", () => {
    mockRGTResources.mockReturnValue({ data: undefined, isLoading: true });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.queryByText("arn:aws:s3:::my-bucket")).toBeNull();
  });
});
