import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ContentLayout,
  Header,
  Box,
  BreadcrumbGroup,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  Tabs,
  type SelectProps,
  type TabsProps,
} from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { getServiceLabel } from "../types/services";
import StatusBadge from "../components/StatusBadge";
import {
  useDynamoDBTables,
  useDynamoDBCreateTable,
  useDynamoDBDeleteTable,
} from "../hooks/useDynamoDB";
import {
  useLogGroups,
  useCreateLogGroup,
  useDeleteLogGroup,
  usePutRetentionPolicy,
  useDeleteRetentionPolicy,
  useLogStreams,
  useCreateLogStream,
  useDeleteLogStream,
  useLogEvents,
  usePutLogEvents,
  useSubscriptionFilters,
  usePutSubscriptionFilter,
  useDeleteSubscriptionFilter,
  useLogGroupTags,
  useTagLogGroup,
  useUntagLogGroup,
} from "../hooks/useLogs";
import {
  useRDSDBInstances,
  useRDSCreateDBInstance,
  useRDSDeleteDBInstance,
  useRDSRebootDBInstance,
  useRDSDBInstance,
  useRDSDBClusters,
  useRDSCreateDBCluster,
  useRDSDeleteDBCluster,
  useRDSDBCluster,
  useRDSParameterGroups,
  useRDSCreateParameterGroup,
  useRDSDeleteParameterGroup,
  useRDSModifyParameterGroupParameters,
  useRDSClusterParameterGroups,
  useRDSCreateClusterParameterGroup,
  useRDSDeleteClusterParameterGroup,
  type ParameterListResponse,
} from "../hooks/useRDS";
import { api } from "../lib/client";
import { formatBytes } from "../lib/utils";
import ResourceTable from "../components/ResourceTable";
import DeleteButton from "../components/DeleteButton";
import DynamoDBTableDetail from "../components/DynamoDBTableDetail";

const KEY_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "String (S)", value: "S" },
  { label: "Number (N)", value: "N" },
  { label: "Binary (B)", value: "B" },
];

const ENGINE_OPTIONS: SelectProps.Option[] = [
  { label: "PostgreSQL", value: "postgres" },
  { label: "MySQL", value: "mysql" },
  { label: "MariaDB", value: "mariadb" },
];

const AURORA_ENGINE_OPTIONS: SelectProps.Option[] = [
  { label: "Aurora PostgreSQL", value: "aurora-postgresql" },
  { label: "Aurora MySQL", value: "aurora-mysql" },
];

const DB_CLASS_OPTIONS: SelectProps.Option[] = [
  { label: "db.t3.micro", value: "db.t3.micro" },
  { label: "db.t3.small", value: "db.t3.small" },
  { label: "db.t3.medium", value: "db.t3.medium" },
  { label: "db.r5.large", value: "db.r5.large" },
  { label: "db.r5.xlarge", value: "db.r5.xlarge" },
];

const PG_FAMILY_OPTIONS: SelectProps.Option[] = [
  { label: "postgres16", value: "postgres16" },
  { label: "postgres15", value: "postgres15" },
  { label: "mysql8", value: "mysql8" },
  { label: "mariadb11", value: "mariadb11" },
];

const CLUSTER_PG_FAMILY_OPTIONS: SelectProps.Option[] = [
  { label: "aurora-postgresql16", value: "aurora-postgresql16" },
  { label: "aurora-postgresql15", value: "aurora-postgresql15" },
  { label: "aurora-mysql8", value: "aurora-mysql8" },
];

/** Services with a fully implemented backend that can show a resource list */
const IMPLEMENTED_SERVICES = new Set(["dynamodb", "rds", "logs"]);

export default function ServicePage() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { data: health } = useHealth();

  if (!service) return null;

  const label = getServiceLabel(service);
  const status = (health?.services[service] || "available") as
    | "running"
    | "available";

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: label, href: `/#/services/${service}` },
            ]}
            onFollow={(e) => {
              e.preventDefault();
              navigate(e.detail.href.replace("/#", ""));
            }}
          />
          <Header
            variant="h1"
            description={
              IMPLEMENTED_SERVICES.has(service)
                ? "Manage resources"
                : "Service management coming soon"
            }
          >
            {label} <StatusBadge status={status} />
          </Header>
        </SpaceBetween>
      }
    >
      {IMPLEMENTED_SERVICES.has(service) ? (
        <ServiceResourceList service={service} />
      ) : (
        <Box textAlign="center" padding={{ top: "xxxl", bottom: "xxxl" }}>
          <Box variant="h2" padding={{ bottom: "s" }}>
            Coming soon
          </Box>
          <Box variant="p" color="text-body-secondary" padding={{ bottom: "l" }}>
            This service page is under development. S3 is fully implemented —
            visit the S3 page for bucket and object management.
          </Box>
        </Box>
      )}
    </ContentLayout>
  );
}

function ServiceResourceList({ service }: { service: string }) {
  if (service === "dynamodb") return <DynamoDBTables />;
  if (service === "rds") return <RDSDashboard />;
  if (service === "logs") return <CloudWatchLogsDashboard />;
  return null;
}

// ────────────────────────────────────────────────────────
//  DynamoDB
// ────────────────────────────────────────────────────────

function DynamoDBTables() {
  const { data, isLoading, isError, error } = useDynamoDBTables();
  const createTable = useDynamoDBCreateTable();
  const deleteTable = useDynamoDBDeleteTable();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [hashKey, setHashKey] = useState("");
  const [hashType, setHashType] = useState(KEY_TYPE_OPTIONS[0]);
  const [rangeKey, setRangeKey] = useState("");
  const [rangeType, setRangeType] = useState(KEY_TYPE_OPTIONS[0]);

  const items = (data?.tables || []).map((name) => ({ name }));

  function resetForm() {
    setName("");
    setHashKey("");
    setHashType(KEY_TYPE_OPTIONS[0]);
    setRangeKey("");
    setRangeType(KEY_TYPE_OPTIONS[0]);
  }

  function handleCreate() {
    if (!name || !hashKey) return;
    createTable.mutate(
      {
        name,
        hashKey,
        hashType: hashType.value,
        ...(rangeKey ? { rangeKey, rangeType: rangeType.value } : {}),
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  if (selectedTable) {
    return (
      <DynamoDBTableDetail
        tableName={selectedTable}
        onBack={() => setSelectedTable(null)}
      />
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load tables"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Table"
        headerTitle="Tables"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Table name",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => setSelectedTable(item.name)}
              >
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="table"
                loading={
                  deleteTable.isPending && deleteTable.variables === item.name
                }
                onDelete={() => deleteTable.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No tables found"
        filterEnabled
        filterPlaceholder="Find tables by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create DynamoDB table"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createTable.isPending}
                disabled={!name || !hashKey}
                onClick={handleCreate}
              >
                Create table
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createTable.isError && (
            <Alert type="error" dismissible>
              {(createTable.error as Error)?.message ||
                "Failed to create table"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Table name"
              description="Must be unique within your account. Use alphanumeric characters, hyphens, and underscores."
            >
              <Input
                value={name}
                onChange={({ detail }) => setName(detail.value)}
                placeholder="my-table"
              />
            </FormField>
            <FormField
              label="Partition key"
              description="The primary attribute that uniquely identifies each item (HASH key)."
              constraintText="Key name must start with a letter and contain only alphanumeric characters."
            >
              <Input
                value={hashKey}
                onChange={({ detail }) => setHashKey(detail.value)}
                placeholder="pk"
              />
            </FormField>
            <FormField label="Partition key type">
              <Select
                selectedOption={hashType}
                onChange={({ detail }) => setHashType(detail.selectedOption)}
                options={KEY_TYPE_OPTIONS}
              />
            </FormField>
            <FormField
              label="Sort key (optional)"
              description="A secondary attribute for sorting items within the same partition key (RANGE key)."
            >
              <Input
                value={rangeKey}
                onChange={({ detail }) => setRangeKey(detail.value)}
                placeholder="sk"
              />
            </FormField>
            {rangeKey && (
              <FormField label="Sort key type">
                <Select
                  selectedOption={rangeType}
                  onChange={({ detail }) => setRangeType(detail.selectedOption)}
                  options={KEY_TYPE_OPTIONS}
                />
              </FormField>
            )}
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  RDS
// ────────────────────────────────────────────────────────

function RDSDashboard() {
  const [selectedTab, setSelectedTab] = useState("db-instances");
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  if (selectedInstance) {
    return (
      <RDSDBInstanceDetail
        id={selectedInstance}
        onBack={() => setSelectedInstance(null)}
      />
    );
  }

  if (selectedCluster) {
    return (
      <RDSDBClusterDetail
        id={selectedCluster}
        onBack={() => setSelectedCluster(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "db-instances",
      label: "DB Instances",
      content: <RDSDBInstanceList onSelect={(id) => setSelectedInstance(id)} />,
    },
    {
      id: "db-clusters",
      label: "DB Clusters",
      content: <RDSDBClusterList onSelect={(id) => setSelectedCluster(id)} />,
    },
    {
      id: "parameter-groups",
      label: "Parameter Groups",
      content: <RDSParameterGroupList />,
    },
    {
      id: "cluster-parameter-groups",
      label: "Cluster Parameter Groups",
      content: <RDSClusterParameterGroupList />,
    },
  ];

  return (
    <Tabs
      activeTabId={selectedTab}
      onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
      tabs={tabs}
    />
  );
}

// ─── DB Instance List ──────────────────────────────────

function RDSDBInstanceList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, error } = useRDSDBInstances();
  const deleteInstance = useRDSDeleteDBInstance();
  const rebootInstance = useRDSRebootDBInstance();
  const createInstance = useRDSCreateDBInstance();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    dbInstanceIdentifier: "",
    engine: ENGINE_OPTIONS[0],
    dbInstanceClass: DB_CLASS_OPTIONS[0],
    masterUsername: "admin",
    masterPassword: "password",
    allocatedStorage: "20",
    dbName: "",
    engineVersion: "",
  });

  const items = (data?.instances || []).map((i) => ({
    id: i.id,
    engine: i.engine,
    engineVersion: i.engineVersion,
    status: i.status,
    dbInstanceClass: i.dbInstanceClass,
    allocatedStorage: i.allocatedStorage,
    masterUsername: i.masterUsername,
    endpoint: i.endpoint,
  }));

  function resetForm() {
    setForm({
      dbInstanceIdentifier: "",
      engine: ENGINE_OPTIONS[0],
      dbInstanceClass: DB_CLASS_OPTIONS[0],
      masterUsername: "admin",
      masterPassword: "password",
      allocatedStorage: "20",
      dbName: "",
      engineVersion: "",
    });
  }

  function handleCreate() {
    if (!form.dbInstanceIdentifier) return;
    createInstance.mutate(
      {
        dbInstanceIdentifier: form.dbInstanceIdentifier,
        engine: form.engine.value,
        dbInstanceClass: form.dbInstanceClass.value,
        masterUsername: form.masterUsername,
        masterPassword: form.masterPassword,
        allocatedStorage: parseInt(form.allocatedStorage) || 20,
        dbName: form.dbName || undefined,
        engineVersion: form.engineVersion || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load DB instances"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="DB Instance"
        headerTitle="DB Instances"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "Identifier",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.id)}>
                {item.id}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "engine",
            header: "Engine",
            cell: (item: any) => item.engine,
          },
          {
            id: "class",
            header: "Class",
            cell: (item: any) => item.dbInstanceClass,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "available"
                    ? "success"
                    : item.status === "creating" || item.status === "rebooting"
                    ? "in-progress"
                    : "warning"
                }
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="icon"
                  iconName="refresh"
                  ariaLabel={`Reboot ${item.id}`}
                  loading={
                    rebootInstance.isPending &&
                    rebootInstance.variables === item.id
                  }
                  onClick={() => rebootInstance.mutate(item.id)}
                />
                <DeleteButton
                  itemName={item.id}
                  resourceType="DB instance"
                  loading={
                    deleteInstance.isPending &&
                    deleteInstance.variables === item.id
                  }
                  onDelete={() => deleteInstance.mutateAsync(item.id)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No DB instances found"
        filterEnabled
        filterPlaceholder="Find instances by identifier"
        filterFunction={(item: any, searchText: string) =>
          item.id.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create DB Instance"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createInstance.isPending}
                disabled={!form.dbInstanceIdentifier}
                onClick={handleCreate}
              >
                Create instance
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createInstance.isError && (
            <Alert type="error" dismissible>
              {(createInstance.error as Error)?.message ||
                "Failed to create DB instance"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="DB instance identifier"
              description="Must be unique. Use lowercase letters, hyphens, and numbers."
            >
              <Input
                value={form.dbInstanceIdentifier}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, dbInstanceIdentifier: detail.value }))
                }
                placeholder="my-database"
              />
            </FormField>
            <FormField label="Engine">
              <Select
                selectedOption={form.engine}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engine: detail.selectedOption }))
                }
                options={ENGINE_OPTIONS}
              />
            </FormField>
            <FormField label="DB instance class">
              <Select
                selectedOption={form.dbInstanceClass}
                onChange={({ detail }) =>
                  setForm((p) => ({
                    ...p,
                    dbInstanceClass: detail.selectedOption,
                  }))
                }
                options={DB_CLASS_OPTIONS}
              />
            </FormField>
            <FormField
              label="Master username"
              description="Default: admin"
            >
              <Input
                value={form.masterUsername}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterUsername: detail.value }))
                }
              />
            </FormField>
            <FormField
              label="Master password"
              description="Default: password"
            >
              <Input
                type="password"
                value={form.masterPassword}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterPassword: detail.value }))
                }
              />
            </FormField>
            <FormField
              label="Allocated storage (GB)"
              description="Default: 20 GB"
            >
              <Input
                type="number"
                value={form.allocatedStorage}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, allocatedStorage: detail.value }))
                }
              />
            </FormField>
            <FormField
              label="Initial database name (optional)"
            >
              <Input
                value={form.dbName}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, dbName: detail.value }))
                }
                placeholder="mydb"
              />
            </FormField>
            <FormField
              label="Engine version (optional)"
            >
              <Input
                value={form.engineVersion}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engineVersion: detail.value }))
                }
                placeholder="16.4"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── DB Instance Detail ────────────────────────────────

function RDSDBInstanceDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useRDSDBInstance(id);
  const rebootInstance = useRDSRebootDBInstance();
  const deleteInstance = useRDSDeleteDBInstance();

  if (isLoading) return <StatusIndicator type="loading">Loading instance details...</StatusIndicator>;

  if (isError) {
    return (
      <StatusIndicator type="error">
        {(error as Error)?.message || "Failed to load instance details"}
      </StatusIndicator>
    );
  }

  if (!data) return null;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to DB Instances
      </Button>

      <Header
        variant="h2"
        description={`${data.engine} ${data.engineVersion || ""} — ${data.dbInstanceClass}`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              iconName="refresh"
              loading={rebootInstance.isPending}
              onClick={() => rebootInstance.mutate(id)}
            >
              Reboot
            </Button>
            <DeleteButton
              itemName={id}
              resourceType="DB instance"
              loading={
                deleteInstance.isPending && deleteInstance.variables === id
              }
              onDelete={() => deleteInstance.mutateAsync(id).then(() => onBack())}
            />
          </SpaceBetween>
        }
      >
        {data.id}
      </Header>

      <Box variant="div">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              { label: "Status", value: data.status },
              { label: "Engine", value: `${data.engine} ${data.engineVersion || ""}` },
              { label: "Instance class", value: data.dbInstanceClass },
              { label: "Allocated storage", value: `${data.allocatedStorage} GB` },
              { label: "Master username", value: data.masterUsername },
              { label: "Endpoint", value: data.endpoint ? `${data.endpoint.address}:${data.endpoint.port}` : "N/A" },
              { label: "Database name", value: data.dbName || "N/A" },
              { label: "Cluster", value: data.dbClusterIdentifier || "Standalone" },
              { label: "Parameter group", value: data.parameterGroupName || "default" },
              { label: "Publicly accessible", value: data.publiclyAccessible ? "Yes" : "No" },
              { label: "Multi-AZ", value: data.multiAZ ? "Yes" : "No" },
              { label: "Storage type", value: data.storageType },
              { label: "Backup retention", value: `${data.backupRetentionPeriod} days` },
              { label: "Auto minor version upgrade", value: data.autoMinorVersionUpgrade ? "Enabled" : "Disabled" },
              { label: "IAM auth", value: data.iamDatabaseAuthenticationEnabled ? "Enabled" : "Disabled" },
              { label: "Copy tags to snapshots", value: data.copyTagsToSnapshot ? "Yes" : "No" },
              { label: "ARN", value: data.arn || "N/A" },
            ].map((row) => (
              <tr
                key={row.label}
                style={{ borderBottom: "1px solid var(--color-border-divider-default, #eaeded)" }}
              >
                <td style={{ padding: "8px 12px", fontWeight: 600, width: "220px", verticalAlign: "top" }}>
                  {row.label}
                </td>
                <td style={{ padding: "8px 12px" }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </SpaceBetween>
  );
}

// ─── DB Cluster List ───────────────────────────────────

function RDSDBClusterList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, error } = useRDSDBClusters();
  const deleteCluster = useRDSDeleteDBCluster();
  const createCluster = useRDSCreateDBCluster();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    dbClusterIdentifier: "",
    engine: AURORA_ENGINE_OPTIONS[0],
    engineVersion: "",
    masterUsername: "admin",
    masterPassword: "password",
    databaseName: "",
  });

  const items = (data?.clusters || []).map((c) => ({
    id: c.id,
    engine: c.engine,
    engineVersion: c.engineVersion,
    status: c.status,
    masterUsername: c.masterUsername,
    databaseName: c.databaseName,
    endpoint: c.endpoint,
    memberCount: c.clusterMembers.length,
  }));

  function resetForm() {
    setForm({
      dbClusterIdentifier: "",
      engine: AURORA_ENGINE_OPTIONS[0],
      engineVersion: "",
      masterUsername: "admin",
      masterPassword: "password",
      databaseName: "",
    });
  }

  function handleCreate() {
    if (!form.dbClusterIdentifier) return;
    createCluster.mutate(
      {
        dbClusterIdentifier: form.dbClusterIdentifier,
        engine: form.engine.value,
        engineVersion: form.engineVersion || undefined,
        masterUsername: form.masterUsername,
        masterPassword: form.masterPassword,
        databaseName: form.databaseName || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load DB clusters"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="DB Cluster"
        headerTitle="DB Clusters"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "Identifier",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.id)}>
                {item.id}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "engine",
            header: "Engine",
            cell: (item: any) => `${item.engine} ${item.engineVersion || ""}`,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "available"
                    ? "success"
                    : item.status === "creating"
                    ? "in-progress"
                    : "warning"
                }
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "members",
            header: "Members",
            cell: (item: any) => item.memberCount,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="DB cluster"
                loading={
                  deleteCluster.isPending && deleteCluster.variables === item.id
                }
                onDelete={() => deleteCluster.mutateAsync(item.id)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No DB clusters found"
        filterEnabled
        filterPlaceholder="Find clusters by identifier"
        filterFunction={(item: any, searchText: string) =>
          item.id.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create DB Cluster"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createCluster.isPending}
                disabled={!form.dbClusterIdentifier}
                onClick={handleCreate}
              >
                Create cluster
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createCluster.isError && (
            <Alert type="error" dismissible>
              {(createCluster.error as Error)?.message ||
                "Failed to create DB cluster"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="DB cluster identifier"
              description="Must be unique. Use lowercase letters, hyphens, and numbers."
            >
              <Input
                value={form.dbClusterIdentifier}
                onChange={({ detail }) =>
                  setForm((p) => ({
                    ...p,
                    dbClusterIdentifier: detail.value,
                  }))
                }
                placeholder="my-cluster"
              />
            </FormField>
            <FormField label="Engine">
              <Select
                selectedOption={form.engine}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engine: detail.selectedOption }))
                }
                options={AURORA_ENGINE_OPTIONS}
              />
            </FormField>
            <FormField label="Engine version (optional)">
              <Input
                value={form.engineVersion}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engineVersion: detail.value }))
                }
                placeholder="16.4"
              />
            </FormField>
            <FormField label="Master username">
              <Input
                value={form.masterUsername}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterUsername: detail.value }))
                }
              />
            </FormField>
            <FormField label="Master password">
              <Input
                type="password"
                value={form.masterPassword}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterPassword: detail.value }))
                }
              />
            </FormField>
            <FormField label="Initial database name (optional)">
              <Input
                value={form.databaseName}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, databaseName: detail.value }))
                }
                placeholder="mydb"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── DB Cluster Detail ─────────────────────────────────

function RDSDBClusterDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useRDSDBCluster(id);
  const deleteCluster = useRDSDeleteDBCluster();

  if (isLoading) return <StatusIndicator type="loading">Loading cluster details...</StatusIndicator>;

  if (isError) {
    return (
      <StatusIndicator type="error">
        {(error as Error)?.message || "Failed to load cluster details"}
      </StatusIndicator>
    );
  }

  if (!data) return null;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to DB Clusters
      </Button>

      <Header
        variant="h2"
        description={`${data.engine} ${data.engineVersion || ""}`}
        actions={
          <DeleteButton
            itemName={id}
            resourceType="DB cluster"
            loading={deleteCluster.isPending && deleteCluster.variables === id}
            onDelete={() => deleteCluster.mutateAsync(id).then(() => onBack())}
          />
        }
      >
        {data.id}
      </Header>

      <Box variant="div">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              { label: "Status", value: data.status },
              { label: "Engine", value: `${data.engine} ${data.engineVersion || ""}` },
              { label: "Master username", value: data.masterUsername },
              { label: "Database name", value: data.databaseName || "N/A" },
              { label: "Endpoint", value: data.endpoint || "N/A" },
              { label: "Reader endpoint", value: data.readerEndpoint || "N/A" },
              { label: "Port", value: data.port?.toString() || "N/A" },
              { label: "Parameter group", value: data.parameterGroupName || "default" },
              { label: "Cluster members", value: data.clusterMembers.length > 0 ? data.clusterMembers.join(", ") : "None" },
              { label: "IAM auth", value: data.iamDatabaseAuthenticationEnabled ? "Enabled" : "Disabled" },
              { label: "Allocated storage", value: data.allocatedStorage ? `${data.allocatedStorage} GB` : "N/A" },
              { label: "Backup retention", value: data.backupRetentionPeriod ? `${data.backupRetentionPeriod} days` : "N/A" },
              { label: "Copy tags to snapshots", value: data.copyTagsToSnapshot ? "Yes" : "No" },
              { label: "ARN", value: data.arn || "N/A" },
            ].map((row) => (
              <tr
                key={row.label}
                style={{ borderBottom: "1px solid var(--color-border-divider-default, #eaeded)" }}
              >
                <td style={{ padding: "8px 12px", fontWeight: 600, width: "220px", verticalAlign: "top" }}>
                  {row.label}
                </td>
                <td style={{ padding: "8px 12px" }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </SpaceBetween>
  );
}

// ─── Parameter Group List ──────────────────────────────

function RDSParameterGroupList() {
  const { data, isLoading, isError, error } = useRDSParameterGroups();
  const createPG = useRDSCreateParameterGroup();
  const deletePG = useRDSDeleteParameterGroup();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    family: PG_FAMILY_OPTIONS[0],
    description: "",
  });

  const items = (data?.parameterGroups || []).map((g) => ({
    name: g.name,
    family: g.family,
    description: g.description,
  }));

  function resetForm() {
    setForm({ name: "", family: PG_FAMILY_OPTIONS[0], description: "" });
  }

  function handleCreate() {
    if (!form.name) return;
    createPG.mutate(
      {
        dbParameterGroupName: form.name,
        dbParameterGroupFamily: form.family.value,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  // Show parameters for selected group
  if (selectedGroup) {
    return (
      <RDSParameterGroupParametersView
        name={selectedGroup}
        type="parameter-group"
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load parameter groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Parameter Group"
        headerTitle="Parameter Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => setSelectedGroup(item.name)}>
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "family",
            header: "Family",
            cell: (item: any) => item.family,
          },
          {
            id: "description",
            header: "Description",
            cell: (item: any) => item.description,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="parameter group"
                loading={
                  deletePG.isPending && deletePG.variables === item.name
                }
                onDelete={() => deletePG.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No parameter groups found"
        filterEnabled
        filterPlaceholder="Find groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create Parameter Group"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createPG.isPending}
                disabled={!form.name}
                onClick={handleCreate}
              >
                Create group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createPG.isError && (
            <Alert type="error" dismissible>
              {(createPG.error as Error)?.message ||
                "Failed to create parameter group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Parameter group name"
              description="Must be unique within your account."
            >
              <Input
                value={form.name}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, name: detail.value }))
                }
                placeholder="my-params"
              />
            </FormField>
            <FormField label="Parameter group family">
              <Select
                selectedOption={form.family}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, family: detail.selectedOption }))
                }
                options={PG_FAMILY_OPTIONS}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, description: detail.value }))
                }
                placeholder="My custom parameter group"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Parameter Group Parameters View ───────────────────

function RDSParameterGroupParametersView({
  name,
  type,
  onBack,
}: {
  name: string;
  type: "parameter-group" | "cluster-parameter-group";
  onBack: () => void;
}) {
  const isCluster = type === "cluster-parameter-group";
  const paramsQueryKey = isCluster
    ? ["aws", "rds", "cluster-parameter-group", name, "parameters"]
    : ["aws", "rds", "parameter-group", name, "parameters"];

  const { data, isLoading, isError, error } = useQuery<ParameterListResponse>({
    queryKey: paramsQueryKey,
    queryFn: () =>
      api(
        isCluster
          ? `/aws/rds/cluster-parameter-groups/${name}/parameters`
          : `/aws/rds/parameter-groups/${name}/parameters`
      ),
    enabled: !!name,
  });

  const modifyParams = useRDSModifyParameterGroupParameters();

  const [editParam, setEditParam] = useState<{
    parameterName: string;
    parameterValue: string;
  } | null>(null);

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to {isCluster ? "Cluster " : ""}Parameter Groups
      </Button>

      <Header
        variant="h2"
        description={`${isCluster ? "Cluster " : ""}Parameter group: ${name}`}
      >
        Parameters
      </Header>

      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load parameters"}
        </StatusIndicator>
      )}

      {data && (
        <ResourceTable
          resourceName="Parameter"
          items={data.parameters}
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (item: any) => item.name,
              isRowHeader: true,
            },
            {
              id: "value",
              header: "Value",
              cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <span>{item.value || "(not set)"}</span>
                  {item.isModifiable && (
                    <Button
                      variant="inline-icon"
                      iconName="edit"
                      ariaLabel={`Edit ${item.name}`}
                      onClick={() =>
                        setEditParam({
                          parameterName: item.name,
                          parameterValue: item.value || "",
                        })
                      }
                    />
                  )}
                </SpaceBetween>
              ),
            },
            {
              id: "type",
              header: "Type",
              cell: (item: any) => item.applyType || "static",
            },
            {
              id: "source",
              header: "Source",
              cell: (item: any) => item.source || "engine-default",
            },
            {
              id: "modifiable",
              header: "Modifiable",
              cell: (item: any) =>
                item.isModifiable ? "Yes" : "No",
            },
          ]}
          loading={isLoading}
          emptyMessage="No parameters found"
          filterEnabled
          filterPlaceholder="Find parameters by name"
        />
      )}

      <Modal
        visible={editParam !== null}
        onDismiss={() => setEditParam(null)}
        header={`Edit parameter: ${editParam?.parameterName}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditParam(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={modifyParams.isPending}
                onClick={() => {
                  if (!editParam) return;
                  modifyParams.mutate(
                    {
                      name,
                      parameters: [editParam],
                    },
                    {
                      onSuccess: () => setEditParam(null),
                    }
                  );
                }}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Parameter value">
              <Input
                value={editParam?.parameterValue || ""}
                onChange={({ detail }) =>
                  setEditParam((p) =>
                    p ? { ...p, parameterValue: detail.value } : null
                  )
                }
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  CloudWatch Logs
// ────────────────────────────────────────────────────────

const RETENTION_OPTIONS: SelectProps.Option[] = [
  { label: "1 day", value: "1" },
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
  { label: "120 days", value: "120" },
  { label: "150 days", value: "150" },
  { label: "180 days", value: "180" },
  { label: "365 days", value: "365" },
  { label: "400 days", value: "400" },
  { label: "545 days", value: "545" },
  { label: "731 days", value: "731" },
  { label: "1827 days", value: "1827" },
  { label: "3653 days", value: "3653" },
  { label: "Never expire", value: "0" },
];

const LOG_VIEW_LIMIT_OPTIONS: SelectProps.Option[] = [
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "500", value: "500" },
  { label: "1000", value: "1000" },
  { label: "10000", value: "10000" },
];

function CloudWatchLogsDashboard() {
  const [selectedTab, setSelectedTab] = useState("log-groups");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (selectedGroup) {
    return (
      <CloudWatchLogGroupDetail
        name={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "log-groups",
      label: "Log Groups",
      content: <CloudWatchLogGroupList onSelect={(name) => setSelectedGroup(name)} />,
    },
  ];

  return (
    <Tabs
      activeTabId={selectedTab}
      onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
      tabs={tabs}
    />
  );
}

// ─── Log Group List ────────────────────────────────────

function CloudWatchLogGroupList({ onSelect }: { onSelect: (name: string) => void }) {
  const { data, isLoading, isError, error } = useLogGroups();
  const createGroup = useCreateLogGroup();
  const deleteGroup = useDeleteLogGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");

  const items = (data?.logGroups || []).map((g) => ({
    logGroupName: g.logGroupName,
    retentionInDays: g.retentionInDays,
    creationTime: g.creationTime,
    storedBytes: g.storedBytes,
    arn: g.arn,
  }));

  function formatRetention(days?: number): string {
    if (!days) return "Never expire";
    if (days === 1) return "1 day";
    if (days === 7) return "7 days";
    if (days === 30) return "30 days";
    if (days === 365) return "1 year";
    return `${days} days`;
  }

  function formatBytesLocal(bytes?: number): string {
    if (!bytes) return "0 B";
    return formatBytes(bytes);
  }

  function handleCreate() {
    if (!groupName) return;
    createGroup.mutate(
      { logGroupName: groupName },
      {
        onSuccess: () => {
          setShowCreate(false);
          setGroupName("");
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load log groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Log Group"
        headerTitle="Log Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Log group name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.logGroupName)}>
                {item.logGroupName}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "retention",
            header: "Retention",
            cell: (item: any) => formatRetention(item.retentionInDays),
          },
          {
            id: "size",
            header: "Stored bytes",
            cell: (item: any) => formatBytesLocal(item.storedBytes),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.logGroupName}
                resourceType="log group"
                loading={
                  deleteGroup.isPending && deleteGroup.variables === item.logGroupName
                }
                onDelete={() => deleteGroup.mutateAsync(item.logGroupName)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No log groups found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find log groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.logGroupName.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          setGroupName("");
        }}
        header="Create Log Group"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  setGroupName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createGroup.isPending}
                disabled={!groupName}
                onClick={handleCreate}
              >
                Create log group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createGroup.isError && (
            <Alert type="error" dismissible>
              {(createGroup.error as Error)?.message ||
                "Failed to create log group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Log group name"
              description="The name of the log group. Use alphanumeric characters, hyphens, underscores, and forward slashes."
            >
              <Input
                value={groupName}
                onChange={({ detail }) => setGroupName(detail.value)}
                placeholder="/aws/lambda/my-function"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Log Group Detail ──────────────────────────────────

function CloudWatchLogGroupDetail({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState("streams");
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  if (selectedStream) {
    return (
      <CloudWatchLogStreamDetail
        logGroupName={name}
        logStreamName={selectedStream}
        onBack={() => setSelectedStream(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "streams",
      label: "Log Streams",
      content: (
        <CloudWatchLogStreamList
          logGroupName={name}
          onSelect={(s) => setSelectedStream(s)}
        />
      ),
    },
    {
      id: "retention",
      label: "Retention",
      content: <CloudWatchRetentionConfig logGroupName={name} />,
    },
    {
      id: "subscription-filters",
      label: "Subscription Filters",
      content: <CloudWatchSubscriptionFilterList logGroupName={name} />,
    },
    {
      id: "tags",
      label: "Tags",
      content: <CloudWatchLogGroupTags logGroupName={name} />,
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Log Groups
      </Button>

      <Header
        variant="h2"
        description="Log group details — streams, retention, subscription filters, and tags"
      >
        {name}
      </Header>

      <Tabs
        activeTabId={selectedTab}
        onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
        tabs={tabs}
      />
    </SpaceBetween>
  );
}

// ─── Log Stream List ───────────────────────────────────

function CloudWatchLogStreamList({
  logGroupName,
  onSelect,
}: {
  logGroupName: string;
  onSelect: (name: string) => void;
}) {
  const { data, isLoading, isError, error } = useLogStreams(logGroupName);
  const createStream = useCreateLogStream();
  const deleteStream = useDeleteLogStream();

  const [showCreate, setShowCreate] = useState(false);
  const [streamName, setStreamName] = useState("");

  const items = (data?.logStreams || []).map((s) => ({
    logStreamName: s.logStreamName,
    creationTime: s.creationTime,
    lastEventTimestamp: s.lastEventTimestamp,
    storedBytes: s.storedBytes,
    lastIngestionTime: s.lastIngestionTime,
  }));

  function formatTimestamp(ts?: number): string {
    if (!ts) return "—";
    return new Date(ts).toLocaleString();
  }

  function handleCreate() {
    if (!streamName) return;
    createStream.mutate(
      { logGroupName, logStreamName: streamName },
      {
        onSuccess: () => {
          setShowCreate(false);
          setStreamName("");
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load log streams"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Log Stream"
        headerTitle={`Log Streams for ${logGroupName}`}
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Log stream name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.logStreamName)}>
                {item.logStreamName}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "lastEvent",
            header: "Last event",
            cell: (item: any) => formatTimestamp(item.lastEventTimestamp),
          },
          {
            id: "size",
            header: "Stored bytes",
            cell: (item: any) =>
              item.storedBytes ? `${(item.storedBytes / 1024).toFixed(1)} KB` : "0 B",
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.logStreamName}
                resourceType="log stream"
                loading={
                  deleteStream.isPending &&
                  deleteStream.variables.logStreamName === item.logStreamName
                }
                onDelete={() =>
                  deleteStream.mutateAsync({
                    logGroupName,
                    logStreamName: item.logStreamName,
                  })
                }
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No log streams found"
        filterEnabled
        filterPlaceholder="Find streams by name"
        filterFunction={(item: any, searchText: string) =>
          item.logStreamName.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          setStreamName("");
        }}
        header="Create Log Stream"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  setStreamName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createStream.isPending}
                disabled={!streamName}
                onClick={handleCreate}
              >
                Create log stream
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createStream.isError && (
            <Alert type="error" dismissible>
              {(createStream.error as Error)?.message ||
                "Failed to create log stream"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Log stream name"
              description="The name of the log stream within this log group."
            >
              <Input
                value={streamName}
                onChange={({ detail }) => setStreamName(detail.value)}
                placeholder="my-stream"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Log Stream Detail (Live Log Viewer) ───────────────

function CloudWatchLogStreamDetail({
  logGroupName,
  logStreamName,
  onBack,
}: {
  logGroupName: string;
  logStreamName: string;
  onBack: () => void;
}) {
  const [limit, setLimit] = useState(LOG_VIEW_LIMIT_OPTIONS[2]); // 500 default
  const [autoRefresh, setAutoRefresh] = useState(true);
  const deleteLogStream = useDeleteLogStream();

  const { data, isLoading, isError, error, refetch } = useLogEvents(
    logGroupName,
    logStreamName,
    {
      limit: parseInt((limit.value || "500") as string),
      startFromHead: false,
    },
    autoRefresh
  );

  // Auto-refresh toggle
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = eventsContainerRef.current.scrollHeight;
    }
  }, [data?.events, autoScroll]);

  const events = (data?.events || []).slice().reverse(); // newest first

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Log Streams
      </Button>

      <Header
        variant="h2"
        description={`${logGroupName} > ${logStreamName}`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Select
              selectedOption={limit}
              onChange={({ detail }) => setLimit(detail.selectedOption)}
              options={LOG_VIEW_LIMIT_OPTIONS}
              ariaLabel="Events limit"
            />
            <Button
              iconName="refresh"
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "primary" : "normal"}
              iconName={autoRefresh ? "undo" : "refresh"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              variant="normal"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
            </Button>
            <DeleteButton
              itemName={logStreamName}
              resourceType="log stream"
              loading={
                deleteLogStream.isPending &&
                deleteLogStream.variables.logStreamName === logStreamName
              }
              onDelete={() =>
                deleteLogStream
                  .mutateAsync({ logGroupName, logStreamName })
                  .then(() => onBack())
              }
            />
          </SpaceBetween>
        }
      >
        Log Events
      </Header>

      {isError && (
        <Alert type="error" dismissible>
          {(error as Error)?.message || "Failed to load log events"}
        </Alert>
      )}

      {isLoading && events.length === 0 && (
        <StatusIndicator type="loading">Loading log events...</StatusIndicator>
      )}

      {events.length === 0 && !isLoading && !isError && (
        <Box textAlign="center" padding="xl" color="text-body-secondary">
          No log events found for this stream.
        </Box>
      )}

      <div
        ref={eventsContainerRef}
        style={{
          maxHeight: "600px",
          overflowY: "auto",
          backgroundColor: "var(--color-background-container-content, #0f1b2a)",
          border: "1px solid var(--color-border-divider-default, #2a3a4a)",
          borderRadius: "4px",
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
          fontSize: "12px",
          lineHeight: "1.6",
        }}
        onScroll={() => {
          if (!eventsContainerRef.current) return;
          const el = eventsContainerRef.current;
          const atBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          if (!atBottom) setAutoScroll(false);
        }}
      >
        {events.map((event: any, idx: number) => (
          <div
            key={event.eventId || idx}
            style={{
              display: "flex",
              padding: "2px 8px",
              borderBottom:
                "1px solid var(--color-border-divider-default, #1a2a3a)",
            }}
          >
            <span
              style={{
                color: "var(--color-text-link-default, #44b9d6)",
                minWidth: "140px",
                flexShrink: 0,
                userSelect: "none",
              }}
            >
              {event.timestamp
                ? new Date(event.timestamp).toISOString()
                : "—"}
            </span>
            <span
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color: "var(--color-text-body-default, #d5dbdb)",
              }}
            >
              {event.message}
            </span>
          </div>
        ))}
      </div>

      {isLoading && events.length > 0 && (
        <StatusIndicator type="loading">Refreshing events...</StatusIndicator>
      )}

      {data && (
        <Box textAlign="center" fontSize="body-s" color="text-body-secondary">
          {events.length} events displayed
        </Box>
      )}
    </SpaceBetween>
  );
}

// ─── Retention Config ──────────────────────────────────

function CloudWatchRetentionConfig({ logGroupName }: { logGroupName: string }) {
  const { data, isLoading } = useLogGroups();
  const putRetention = usePutRetentionPolicy();
  const deleteRetention = useDeleteRetentionPolicy();

  const logGroup = (data?.logGroups || []).find(
    (g) => g.logGroupName === logGroupName
  );

  const currentRetention = logGroup?.retentionInDays;
  const [selectedRetention, setSelectedRetention] = useState<SelectProps.Option>(
    currentRetention
      ? RETENTION_OPTIONS.find((o) => o.value === String(currentRetention)) ||
          { label: `${currentRetention} days`, value: String(currentRetention) }
      : RETENTION_OPTIONS[RETENTION_OPTIONS.length - 1] // Never expire
  );

  useEffect(() => {
    if (logGroup?.retentionInDays !== undefined) {
      const found = RETENTION_OPTIONS.find(
        (o) => o.value === String(logGroup.retentionInDays)
      );
      if (found) setSelectedRetention(found);
    }
  }, [logGroup?.retentionInDays]);

  if (isLoading) {
    return <StatusIndicator type="loading">Loading retention settings...</StatusIndicator>;
  }

  return (
    <SpaceBetween size="m">
      <Box variant="p">
        <strong>Current retention:</strong>{" "}
        {currentRetention ? `${currentRetention} days` : "Never expire"}
      </Box>

      <FormField
        label="Retention period"
        description="Number of days to retain log events. Setting 'Never expire' removes the retention policy."
      >
        <Select
          selectedOption={selectedRetention}
          onChange={({ detail }) => setSelectedRetention(detail.selectedOption)}
          options={RETENTION_OPTIONS}
        />
      </FormField>

      {putRetention.isError && (
        <Alert type="error" dismissible>
          {(putRetention.error as Error)?.message ||
            "Failed to update retention policy"}
        </Alert>
      )}

      <SpaceBetween direction="horizontal" size="xs">
        <Button
          variant="primary"
          loading={putRetention.isPending}
          disabled={!selectedRetention.value}
          onClick={() => {
            const days = parseInt(selectedRetention.value as string);
            if (days === 0) {
              deleteRetention.mutate(logGroupName);
            } else {
              putRetention.mutate({
                logGroupName,
                retentionInDays: days,
              });
            }
          }}
        >
          Save retention
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}

// ─── Subscription Filters ──────────────────────────────

function CloudWatchSubscriptionFilterList({
  logGroupName,
}: {
  logGroupName: string;
}) {
  const { data, isLoading, isError, error } = useSubscriptionFilters(logGroupName);
  const putFilter = usePutSubscriptionFilter();
  const deleteFilter = useDeleteSubscriptionFilter();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    filterName: "",
    filterPattern: "",
    destinationArn: "",
    distribution: "",
  });

  const items = (data?.subscriptionFilters || []).map((f) => ({
    filterName: f.filterName,
    filterPattern: f.filterPattern,
    destinationArn: f.destinationArn,
    distribution: f.distribution,
    creationTime: f.creationTime,
    roleArn: f.roleArn,
  }));

  function resetForm() {
    setForm({ filterName: "", filterPattern: "", destinationArn: "", distribution: "" });
  }

  function handleCreate() {
    if (!form.filterName || !form.destinationArn) return;
    putFilter.mutate(
      {
        logGroupName,
        filterName: form.filterName,
        filterPattern: form.filterPattern || undefined,
        destinationArn: form.destinationArn,
        distribution: form.distribution || undefined,
      },
      { onSuccess: () => { setShowCreate(false); resetForm(); } }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load subscription filters"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Subscription Filter"
        headerTitle="Subscription Filters"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Filter name",
            cell: (item: any) => item.filterName,
            isRowHeader: true,
          },
          {
            id: "destination",
            header: "Destination ARN",
            cell: (item: any) => (
              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {item.destinationArn}
              </span>
            ),
          },
          {
            id: "pattern",
            header: "Pattern",
            cell: (item: any) => item.filterPattern || "(all events)",
          },
          {
            id: "distribution",
            header: "Distribution",
            cell: (item: any) => item.distribution || "ByLogStream",
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.filterName}
                resourceType="subscription filter"
                loading={
                  deleteFilter.isPending &&
                  deleteFilter.variables.filterName === item.filterName
                }
                onDelete={() =>
                  deleteFilter.mutateAsync({
                    logGroupName,
                    filterName: item.filterName,
                  })
                }
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No subscription filters"
        filterEnabled
        filterPlaceholder="Find filters by name"
        filterFunction={(item: any, searchText: string) =>
          item.filterName.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create Subscription Filter"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putFilter.isPending}
                disabled={!form.filterName || !form.destinationArn}
                onClick={handleCreate}
              >
                Create filter
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putFilter.isError && (
            <Alert type="error" dismissible>
              {(putFilter.error as Error)?.message ||
                "Failed to create subscription filter"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Filter name"
              description="A name for this subscription filter."
            >
              <Input
                value={form.filterName}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, filterName: detail.value }))
                }
                placeholder="my-filter"
              />
            </FormField>
            <FormField
              label="Destination ARN"
              description="The ARN of the destination (Lambda, Kinesis, or Firehose)."
            >
              <Input
                value={form.destinationArn}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, destinationArn: detail.value }))
                }
                placeholder="arn:aws:lambda:us-east-1:..."
              />
            </FormField>
            <FormField
              label="Filter pattern (optional)"
              description="A filter pattern for matching log events. Leave empty to match all events."
            >
              <Input
                value={form.filterPattern}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, filterPattern: detail.value }))
                }
                placeholder='?ERROR ?WARN'
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Log Group Tags ────────────────────────────────────

function CloudWatchLogGroupTags({ logGroupName }: { logGroupName: string }) {
  const { data, isLoading, isError, error } = useLogGroupTags(logGroupName);
  const tagMutation = useTagLogGroup();
  const untagMutation = useUntagLogGroup();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const tags = data?.tags || {};
  const tagEntries = Object.entries(tags).map(([key, value]) => ({ key, value }));

  function handleAddTag() {
    if (!newKey) return;
    const updated = { ...tags, [newKey]: newValue };
    tagMutation.mutate(
      { logGroupName, tags: updated },
      { onSuccess: () => { setNewKey(""); setNewValue(""); } }
    );
  }

  function handleRemoveTag(key: string) {
    untagMutation.mutate({ logGroupName, tags: [key] });
  }

  if (isLoading) {
    return <StatusIndicator type="loading">Loading tags...</StatusIndicator>;
  }

  if (isError) {
    return (
      <StatusIndicator type="error">
        {(error as Error)?.message || "Failed to load tags"}
      </StatusIndicator>
    );
  }

  return (
    <SpaceBetween size="m">
      {tagEntries.length === 0 && (
        <Box color="text-body-secondary">No tags associated with this log group.</Box>
      )}

      {tagEntries.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--color-border-divider-default, #eaeded)",
              }}
            >
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Key</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Value</th>
              <th style={{ padding: "8px 12px", width: "60px" }}></th>
            </tr>
          </thead>
          <tbody>
            {tagEntries.map(({ key, value }) => (
              <tr
                key={key}
                style={{
                  borderBottom:
                    "1px solid var(--color-border-divider-default, #eaeded)",
                }}
              >
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{key}</td>
                <td style={{ padding: "8px 12px" }}>{value}</td>
                <td style={{ padding: "8px 12px" }}>
                  <Button
                    variant="icon"
                    iconName="remove"
                    ariaLabel={`Remove tag ${key}`}
                    loading={untagMutation.isPending}
                    onClick={() => handleRemoveTag(key)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SpaceBetween direction="horizontal" size="xs">
        <FormField label="Key">
          <Input
            value={newKey}
            onChange={({ detail }) => setNewKey(detail.value)}
            placeholder="tag-key"
          />
        </FormField>
        <FormField label="Value">
          <Input
            value={newValue}
            onChange={({ detail }) => setNewValue(detail.value)}
            placeholder="tag-value"
          />
        </FormField>
        <Button
          variant="primary"
          loading={tagMutation.isPending}
          disabled={!newKey}
          onClick={handleAddTag}
        >
          Add tag
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}

// ─── Cluster Parameter Group List ──────────────────────

function RDSClusterParameterGroupList() {
  const { data, isLoading, isError, error } = useRDSClusterParameterGroups();
  const createCPG = useRDSCreateClusterParameterGroup();
  const deleteCPG = useRDSDeleteClusterParameterGroup();

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    family: CLUSTER_PG_FAMILY_OPTIONS[0],
    description: "",
  });

  const items = (data?.clusterParameterGroups || []).map((g) => ({
    name: g.name,
    family: g.family,
    description: g.description,
  }));

  function resetForm() {
    setForm({
      name: "",
      family: CLUSTER_PG_FAMILY_OPTIONS[0],
      description: "",
    });
  }

  function handleCreate() {
    if (!form.name) return;
    createCPG.mutate(
      {
        dbClusterParameterGroupName: form.name,
        dbParameterGroupFamily: form.family.value,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  if (selectedGroup) {
    return (
      <RDSParameterGroupParametersView
        name={selectedGroup}
        type="cluster-parameter-group"
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load cluster parameter groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Cluster Parameter Group"
        headerTitle="Cluster Parameter Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => setSelectedGroup(item.name)}>
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "family",
            header: "Family",
            cell: (item: any) => item.family,
          },
          {
            id: "description",
            header: "Description",
            cell: (item: any) => item.description,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="cluster parameter group"
                loading={
                  deleteCPG.isPending && deleteCPG.variables === item.name
                }
                onDelete={() => deleteCPG.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No cluster parameter groups found"
        filterEnabled
        filterPlaceholder="Find groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create Cluster Parameter Group"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createCPG.isPending}
                disabled={!form.name}
                onClick={handleCreate}
              >
                Create group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createCPG.isError && (
            <Alert type="error" dismissible>
              {(createCPG.error as Error)?.message ||
                "Failed to create cluster parameter group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Cluster parameter group name"
              description="Must be unique within your account."
            >
              <Input
                value={form.name}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, name: detail.value }))
                }
                placeholder="my-cluster-params"
              />
            </FormField>
            <FormField label="Parameter group family">
              <Select
                selectedOption={form.family}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, family: detail.selectedOption }))
                }
                options={CLUSTER_PG_FAMILY_OPTIONS}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, description: detail.value }))
                }
                placeholder="My custom cluster parameter group"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}
