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
  Textarea,
  ColumnLayout,
  Container,
  Spinner,
  Checkbox,
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
import {
  useECSClusters,
  useCreateECSCluster,
  useDeleteECSCluster,
  useECSServices,
  useECSTasks,
  useECSTaskDefinitions,
  useECSTaskDefinitionFamilies,
  useCreateECSService,
  useDeleteECSService,
  useStopECSTask,
  useRunECSTask,
} from "../hooks/useECS";
import {
  useSSMParameters,
  useSSMParameter,
  usePutSSMParameter,
  useDeleteSSMParameter,
  useSSMParameterHistory,
} from "../hooks/useSSM";
import {
  useRoute53HostedZones,
  useCreateRoute53HostedZone,
  useDeleteRoute53HostedZone,
  useRoute53RecordSets,
  useCreateRoute53RecordSet,
  useDeleteRoute53RecordSet,
} from "../hooks/useRoute53";
import {
  useAPIGatewayApis,
  useAPIGatewayApi,
  useCreateAPIGatewayApi,
  useDeleteAPIGatewayApi,
  useAPIGatewayResources,
  useAPIGatewayDeployments,
} from "../hooks/useAPIGateway";
import { useToast } from "../components/Toast";
import {
  useAppSyncApis,
  useAppSyncApi,
  useCreateAppSyncApi,
  useDeleteAppSyncApi,
  useAppSyncDataSources,
  useCreateAppSyncDataSource,
  useDeleteAppSyncDataSource,
  useAppSyncResolvers,
  useAppSyncFunctions,
  useCreateAppSyncFunction,
  useDeleteAppSyncFunction,
  useAppSyncApiKeys,
  useCreateAppSyncApiKey,
  useDeleteAppSyncApiKey,
  useAppSyncTypes,
} from "../hooks/useAppSync";
import {
  useSchedulerGroups,
  useCreateSchedulerGroup,
  useDeleteSchedulerGroup,
  useSchedules,
  useCreateSchedule,
  useDeleteSchedule,
} from "../hooks/useScheduler";
import {
  useECRRepositories,
  useECRCreateRepository,
  useECRDeleteRepository,
  useECRImages,
  useECRRepositoryPolicy,
  useECRLifecyclePolicy,
} from "../hooks/useECR";
import {
  useELBLoadBalancers,
  useELBCreateLoadBalancer,
  useELBDeleteLoadBalancer,
  useELBTargetGroups,
  useELBCreateTargetGroup,
  useELBDeleteTargetGroup,
  useELBListeners,
  useELBCreateListener,
  useELBDeleteListener,
} from "../hooks/useELB";
import {
  useSESIdentities,
  useSESVerifyEmail,
  useSESVerifyDomain,
  useSESDeleteIdentity,
  useSESSendEmail,
  useSESVerifiedEmails,
} from "../hooks/useSES";
import {
  useSTSCallerIdentity,
  useSTSAssumeRole,
  useSTSGetSessionToken,
} from "../hooks/useSTS";
import {
  useEKSClusters,
  useEKSCreateCluster,
  useEKSDeleteCluster,
  useEKSNodegroups,
  useEKSCreateNodegroup,
  useEKSDeleteNodegroup,
} from "../hooks/useEKS";
import {
  useAutoScalingGroups,
  useCreateAutoScalingGroup,
  useDeleteAutoScalingGroup,
  useLaunchConfigurations,
} from "../hooks/useAutoScaling";
import {
  useCloudFrontDistributions,
  useCloudFrontInvalidations,
  useCreateCloudFrontInvalidation,
  useCloudFrontCachePolicies,
  useCloudFrontFunctions,
} from "../hooks/useCloudFront";
import {
  useKinesisStreams,
  useCreateKinesisStream,
  useDeleteKinesisStream,
  useKinesisShards,
  usePutKinesisRecord,
} from "../hooks/useKinesis";
import {
  useNeptuneClusters,
  useCreateNeptuneCluster,
  useDeleteNeptuneCluster,
  useNeptuneInstances,
  useCreateNeptuneInstance,
  useDeleteNeptuneInstance,
} from "../hooks/useNeptune";
import {
  usePipes,
  useCreatePipe,
  useDeletePipe,
  useStartPipe,
  useStopPipe,
} from "../hooks/usePipes";
import {
  useCognitoUserPools,
  useCreateCognitoUserPool,
  useDeleteCognitoUserPool,
  useCognitoUsers,
  useCreateCognitoUser,
  useDeleteCognitoUser,
  useCognitoGroups,
  useCreateCognitoGroup,
  useDeleteCognitoGroup,
  useCognitoUserPoolClients,
  useCreateCognitoUserPoolClient,
  useDeleteCognitoUserPoolClient,
} from "../hooks/useCognito";

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
const IMPLEMENTED_SERVICES = new Set(["dynamodb", "rds", "logs", "ecs", "ssm", "route53", "apigateway", "appsync", "scheduler", "ecr", "elb", "ses", "sts", "eks", "autoscaling", "cloudfront", "kinesis", "neptune", "pipes", "cognito-idp"]);

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
  if (service === "ecs") return <ECSDashboard />;
  if (service === "ssm") return <SSMDashboard />;
  if (service === "route53") return <Route53Dashboard />;
  if (service === "apigateway") return <APIGatewayDashboard />;
  if (service === "appsync") return <AppSyncDashboard />;
  if (service === "scheduler") return <SchedulerDashboard />;
  if (service === "ecr") return <ECRDashboard />;
  if (service === "elb") return <ELBDashboard />;
  if (service === "ses") return <SESDashboard />;
  if (service === "sts") return <STSDashboard />;
  if (service === "eks") return <EKSDashboard />;
  if (service === "autoscaling") return <AutoScalingDashboard />;
  if (service === "cloudfront") return <CloudFrontDashboard />;
  if (service === "kinesis") return <KinesisDashboard />;
  if (service === "neptune") return <NeptuneDashboard />;
  if (service === "pipes") return <PipesDashboard />;
  if (service === "cognito-idp") return <CognitoDashboard />;
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
//  Route 53 (DNS — Hosted Zones + Record Sets)
// ────────────────────────────────────────────────────────

const RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "A", value: "A" },
  { label: "AAAA", value: "AAAA" },
  { label: "CNAME", value: "CNAME" },
  { label: "MX", value: "MX" },
  { label: "NS", value: "NS" },
  { label: "PTR", value: "PTR" },
  { label: "SOA", value: "SOA" },
  { label: "SPF", value: "SPF" },
  { label: "SRV", value: "SRV" },
  { label: "TXT", value: "TXT" },
];

function Route53Dashboard() {
  const { data, isLoading, isError, error } = useRoute53HostedZones();
  const createZone = useCreateRoute53HostedZone();
  const deleteZone = useDeleteRoute53HostedZone();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", comment: "" });

  const zones = data?.hostedZones || [];

  const columns = [
    { id: "name", header: "Domain Name", cell: (item: any) => item.Name, isRowHeader: true },
    { id: "id", header: "Hosted Zone ID", cell: (item: any) => (item.Id || "").replace("/hostedzone/", "") },
    {
      id: "records",
      header: "Record Sets",
      cell: (item: any) => item.ResourceRecordSetCount ?? 0,
    },
    { id: "comment", header: "Comment", cell: (item: any) => item.Config?.Comment || "—" },
    { id: "private", header: "Private", cell: (item: any) => (item.Config?.PrivateZone ? "Yes" : "No") },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedZone(item.Id.replace("/hostedzone/", ""))}>
            View
          </Button>
          <DeleteButton
            itemName={item.Name}
            resourceType="hosted zone"
            loading={deleteZone.isPending}
            onDelete={() => deleteZone.mutateAsync(item.Id.replace("/hostedzone/", ""))}
          />
        </SpaceBetween>
      ),
    },
  ];

  if (selectedZone) {
    return <Route53ZoneDetail zoneId={selectedZone} onBack={() => setSelectedZone(null)} />;
  }

  return (
    <>
      <ResourceTable
        resourceName="Hosted Zone"
        headerTitle="Route 53 Hosted Zones"
        headerCounter={data?.total}
        items={zones}
        columns={columns}
        loading={isLoading}
        emptyMessage="No hosted zones found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find zones by name"
        filterFunction={(item: any, searchText: string) =>
          (item.Name || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create hosted zone"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createZone.isPending}
                disabled={!form.name.trim()}
                onClick={() => {
                  createZone.mutate(form, {
                    onSuccess: () => {
                      setShowCreate(false);
                      setForm({ name: "", comment: "" });
                    },
                  });
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createZone.isError && (
            <Alert type="error" dismissible>
              {(createZone.error as Error)?.message || "Failed to create hosted zone"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Domain name" description="The name of the domain (e.g. example.com.)">
              <Input
                value={form.name}
                onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))}
                placeholder="example.com."
              />
            </FormField>
            <FormField label="Comment (optional)">
              <Input
                value={form.comment}
                onChange={({ detail }) => setForm((p) => ({ ...p, comment: detail.value }))}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function Route53ZoneDetail({ zoneId, onBack }: { zoneId: string; onBack: () => void }) {
  const { data, isLoading, isError, error } = useRoute53RecordSets(zoneId);
  const createRecord = useCreateRoute53RecordSet();
  const deleteRecord = useDeleteRoute53RecordSet();
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "A",
    ttl: 300,
    value: "",
  });

  const records = data?.recordSets || [];

  const columns = [
    { id: "name", header: "Name", cell: (item: any) => item.Name, isRowHeader: true },
    { id: "type", header: "Type", cell: (item: any) => item.Type || "—" },
    { id: "ttl", header: "TTL", cell: (item: any) => item.TTL ?? "—" },
    {
      id: "value",
      header: "Value",
      cell: (item: any) => {
        if (item.ResourceRecords) {
          return (
            <span style={{ fontFamily: "monospace", fontSize: "0.85em" }}>
              {item.ResourceRecords.map((r: any) => r.Value).join(", ")}
            </span>
          );
        }
        if (item.AliasTarget) {
          return <span style={{ fontFamily: "monospace", fontSize: "0.85em" }}>{item.AliasTarget.DNSName}</span>;
        }
        return "—";
      },
    },
    {
      id: "actions",
      header: "",
      cell: (item: any) =>
        item.Type === "NS" && item.Name === records[0]?.Name ? null : (
          <DeleteButton
            itemName={item.Name}
            resourceType="record"
            loading={deleteRecord.isPending}
            onDelete={() =>
              deleteRecord.mutateAsync({ zoneId, name: item.Name, type: item.Type })
            }
          />
        ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Hosted Zones
      </Button>

      <Header variant="h2" description={`Hosted zone: ${zoneId}`}>
        Resource Record Sets
      </Header>

      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load record sets"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Record"
        headerTitle="Record Sets"
        headerCounter={data?.total}
        items={records}
        columns={columns}
        loading={isLoading}
        emptyMessage="No record sets found."
        filterEnabled
        filterPlaceholder="Find records by name"
        filterFunction={(item: any, searchText: string) =>
          (item.Name || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create record"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createRecord.isPending}
                disabled={!form.name.trim() || !form.value.trim()}
                onClick={() => {
                  createRecord.mutate(
                    {
                      zoneId,
                      action: "CREATE",
                      name: form.name,
                      type: form.type,
                      ttl: Number(form.ttl),
                      resourceRecords: [{ Value: form.value }],
                    },
                    {
                      onSuccess: () => {
                        setShowCreate(false);
                        setForm({ name: "", type: "A", ttl: 300, value: "" });
                      },
                    }
                  );
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createRecord.isError && (
            <Alert type="error" dismissible>
              {(createRecord.error as Error)?.message || "Failed to create record"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Record name">
              <Input
                value={form.name}
                onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))}
                placeholder="www.example.com."
              />
            </FormField>
            <FormField label="Record type">
              <Select
                selectedOption={{ label: form.type, value: form.type }}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, type: detail.selectedOption?.value || "A" }))
                }
                options={RECORD_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="TTL (seconds)">
              <Input
                type="number"
                value={String(form.ttl)}
                onChange={({ detail }) => setForm((p) => ({ ...p, ttl: Number(detail.value) }))}
              />
            </FormField>
            <FormField label="Value">
              <Input
                value={form.value}
                onChange={({ detail }) => setForm((p) => ({ ...p, value: detail.value }))}
                placeholder="192.168.1.1"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  SSM (Systems Manager — Parameter Store)
// ────────────────────────────────────────────────────────

const SSM_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "String", value: "String" },
  { label: "StringList", value: "StringList" },
  { label: "SecureString", value: "SecureString" },
];

function SSMDashboard() {
  const { data, isLoading, isError, error } = useSSMParameters();
  const putParam = usePutSSMParameter();
  const deleteParam = useDeleteSSMParameter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedParam, setSelectedParam] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    value: "",
    type: "String",
    description: "",
    overwrite: false,
  });

  const parameters = data?.parameters || [];

  const columns = [
    { id: "name", header: "Name", cell: (item: any) => item.Name, isRowHeader: true },
    { id: "type", header: "Type", cell: (item: any) => item.Type || "—" },
    { id: "version", header: "Version", cell: (item: any) => item.Version ?? "—" },
    {
      id: "lastModified",
      header: "Last Modified",
      cell: (item: any) =>
        item.LastModifiedDate
          ? new Date(item.LastModifiedDate * 1000).toLocaleString()
          : "—",
    },
    { id: "description", header: "Description", cell: (item: any) => item.Description || "—" },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedParam(item.Name)}>
            View
          </Button>
          <DeleteButton
            itemName={item.Name}
            resourceType="parameter"
            loading={deleteParam.isPending}
            onDelete={() => deleteParam.mutateAsync(item.Name)}
          />
        </SpaceBetween>
      ),
    },
  ];

  if (selectedParam) {
    return (
      <SSMParameterDetail
        name={selectedParam}
        onBack={() => setSelectedParam(null)}
      />
    );
  }

  return (
    <>
      <ResourceTable
        resourceName="Parameter"
        headerTitle="SSM Parameters"
        headerCounter={data?.total}
        items={parameters}
        columns={columns}
        loading={isLoading}
        emptyMessage="No parameters found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find parameters by name"
        filterFunction={(item: any, searchText: string) =>
          (item.Name || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create parameter"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putParam.isPending}
                disabled={!form.name.trim() || !form.value.trim()}
                onClick={() => {
                  putParam.mutate(form, {
                    onSuccess: () => {
                      setShowCreate(false);
                      setForm({ name: "", value: "", type: "String", description: "", overwrite: false });
                    },
                  });
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putParam.isError && (
            <Alert type="error" dismissible>
              {(putParam.error as Error)?.message || "Failed to create parameter"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Name" description="Use / for hierarchical paths (e.g. /myapp/config)">
              <Input
                value={form.name}
                onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))}
                placeholder="/myapp/db-url"
              />
            </FormField>
            <FormField label="Type">
              <Select
                selectedOption={{ label: form.type, value: form.type }}
                onChange={({ detail }) => setForm((p) => ({ ...p, type: detail.selectedOption?.value || "String" }))}
                options={SSM_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Value">
              <Textarea
                value={form.value}
                onChange={({ detail }) => setForm((p) => ({ ...p, value: detail.value }))}
                rows={3}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) => setForm((p) => ({ ...p, description: detail.value }))}
              />
            </FormField>
            <Checkbox
              checked={form.overwrite}
              onChange={({ detail }) => setForm((p) => ({ ...p, overwrite: detail.checked }))}
            >
              Overwrite existing parameter
            </Checkbox>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function SSMParameterDetail({ name, onBack }: { name: string; onBack: () => void }) {
  const { data: paramData, isLoading, isError, error } = useSSMParameter(name);
  const { data: historyData } = useSSMParameterHistory(name);
  const param = paramData?.parameter;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Parameters
      </Button>

      <Header variant="h2" description={param?.ARN}>
        {name}
      </Header>

      {isLoading && <Spinner />}

      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load parameter"}
        </StatusIndicator>
      )}

      {param && (
        <>
          <ColumnLayout columns={3}>
            <div>
              <Box variant="awsui-key-label">Type</Box>
              <div>{param.Type || "—"}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Version</Box>
              <div>{param.Version ?? "—"}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Last Modified</Box>
              <div>
                {param.LastModifiedDate
                  ? new Date(param.LastModifiedDate * 1000).toLocaleString()
                  : "—"}
              </div>
            </div>
          </ColumnLayout>

          <Container header={<Header variant="h3">Value</Header>}>
            <Box>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                {param.Value || "(empty)"}
              </pre>
            </Box>
          </Container>

          {historyData && historyData.total > 0 && (
            <Container
              header={
                <Header variant="h3" counter={historyData.total}>
                  Version History
                </Header>
              }
            >
              <ResourceTable
                resourceName="Version"
                items={historyData.history}
                columns={[
                  { id: "version", header: "Version", cell: (item: any) => item.Version ?? "—" },
                  {
                    id: "value",
                    header: "Value",
                    cell: (item: any) => (
                      <span style={{ fontFamily: "monospace" }}>
                        {(item.Value || "").length > 60
                          ? (item.Value || "").slice(0, 60) + "…"
                          : item.Value || "(empty)"}
                      </span>
                    ),
                  },
                  {
                    id: "modified",
                    header: "Modified",
                    cell: (item: any) =>
                      item.LastModifiedDate
                        ? new Date(item.LastModifiedDate * 1000).toLocaleString()
                        : "—",
                  },
                ]}
                filterEnabled={false}
              />
            </Container>
          )}
        </>
      )}
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  ECS
// ────────────────────────────────────────────────────────

function ECSDashboard() {
  const { data, isLoading, isError, error } = useECSClusters();
  const createCluster = useCreateECSCluster();
  const deleteCluster = useDeleteECSCluster();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [clusterName, setClusterName] = useState("");

  const clusters = data?.clusters || [];

  const clusterColumns = [
    { id: "name", header: "Cluster Name", cell: (item: any) => item.clusterName || "—", isRowHeader: true },
    { id: "status", header: "Status", cell: (item: any) => <StatusBadge status={item.status || "ACTIVE"} /> },
    { id: "runningTasks", header: "Running Tasks", cell: (item: any) => item.runningTasksCount ?? 0 },
    { id: "services", header: "Services", cell: (item: any) => item.activeServicesCount ?? 0 },
    { id: "instances", header: "Container Instances", cell: (item: any) => item.registeredContainerInstancesCount ?? 0 },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedCluster(item.clusterName)}>
            View
          </Button>
          <DeleteButton
            itemName={item.clusterName}
            resourceType="cluster"
            loading={deleteCluster.isPending}
            onDelete={() => deleteCluster.mutateAsync(item.clusterArn)}
          />
        </SpaceBetween>
      ),
    },
  ];

  if (selectedCluster) {
    return <ECSClusterDetail clusterName={selectedCluster} onBack={() => setSelectedCluster(null)} />;
  }

  return (
    <>
      <ResourceTable
        resourceName="Cluster"
        headerTitle="ECS Clusters"
        headerCounter={data?.total}
        items={clusters}
        columns={clusterColumns}
        loading={isLoading}
        emptyMessage="No clusters found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find clusters by name"
        filterFunction={(item: any, searchText: string) =>
          (item.clusterName || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create cluster"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createCluster.isPending}
                disabled={!clusterName.trim()}
                onClick={() => {
                  createCluster.mutate(
                    { clusterName: clusterName.trim() },
                    { onSuccess: () => { setShowCreate(false); setClusterName(""); } }
                  );
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createCluster.isError && (
            <Alert type="error" dismissible>
              {(createCluster.error as Error)?.message || "Failed to create cluster"}
            </Alert>
          )}
          <FormField label="Cluster name" description="Enter a name for your ECS cluster.">
            <Input
              value={clusterName}
              onChange={({ detail }) => setClusterName(detail.value)}
              placeholder="my-cluster"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

function ECSClusterDetail({ clusterName, onBack }: { clusterName: string; onBack: () => void }) {
  const servicesQuery = useECSServices(clusterName);
  const tasksQuery = useECSTasks(clusterName);
  const taskDefsQuery = useECSTaskDefinitions();
  const taskDefFamilies = useECSTaskDefinitionFamilies();
  const createService = useCreateECSService();
  const deleteService = useDeleteECSService();
  const stopTask = useStopECSTask();
  const runTask = useRunECSTask();
  const [showRunTask, setShowRunTask] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);
  const [taskDefInput, setTaskDefInput] = useState("");
  const { showToast } = useToast();

  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    taskDefinition: "",
    desiredCount: 1,
    launchType: "FARGATE",
  });

  const tabs: TabsProps.Tab[] = [
    {
      label: `Services (${servicesQuery.data?.total || 0})`,
      id: "services",
      content: (
        <>
          <ResourceTable
            resourceName="Service"
            headerTitle="Services"
            headerCounter={servicesQuery.data?.total}
            items={servicesQuery.data?.services || []}
            columns={[
              { id: "name", header: "Service Name", cell: (item: any) => item.serviceName, isRowHeader: true },
              { id: "status", header: "Status", cell: (item: any) => <StatusBadge status={item.status || "ACTIVE"} /> },
              { id: "desired", header: "Desired", cell: (item: any) => item.desiredCount ?? 0 },
              { id: "running", header: "Running", cell: (item: any) => item.runningCount ?? 0 },
              { id: "taskDef", header: "Task Definition", cell: (item: any) => item.taskDefinition?.split("/").pop() || "—" },
              {
                id: "actions",
                header: "",
                cell: (item: any) => (
                  <DeleteButton
                    itemName={item.serviceName}
                    resourceType="service"
                    loading={deleteService.isPending}
                    onDelete={() =>
                      deleteService.mutateAsync({
                        cluster: clusterName,
                        service: item.serviceName,
                        force: true,
                      })
                    }
                  />
                ),
              },
            ]}
            loading={servicesQuery.isLoading}
            emptyMessage="No services in this cluster."
            filterEnabled
            filterPlaceholder="Find services"
            filterFunction={(item: any, s: string) => (item.serviceName || "").toLowerCase().includes(s.toLowerCase())}
            onCreate={() => setShowCreateService(true)}
          />
          <Modal
            visible={showCreateService}
            onDismiss={() => { setShowCreateService(false); setServiceForm({ serviceName: "", taskDefinition: "", desiredCount: 1, launchType: "FARGATE" }); }}
            header="Create Service"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowCreateService(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    loading={createService.isPending}
                    disabled={!serviceForm.serviceName.trim() || !serviceForm.taskDefinition.trim()}
                    onClick={() => {
                      createService.mutate(
                        {
                          cluster: clusterName,
                          serviceName: serviceForm.serviceName.trim(),
                          taskDefinition: serviceForm.taskDefinition.trim(),
                          desiredCount: serviceForm.desiredCount,
                          launchType: serviceForm.launchType,
                        },
                        {
                          onSuccess: () => {
                            setShowCreateService(false);
                            setServiceForm({ serviceName: "", taskDefinition: "", desiredCount: 1, launchType: "FARGATE" });
                            showToast("success", `Service "${serviceForm.serviceName}" created`);
                          },
                          onError: (err) => showToast("error", (err as Error)?.message || "Failed to create service"),
                        }
                      );
                    }}
                  >
                    Create
                  </Button>
                </SpaceBetween>
              </Box>
            }
          >
            <Form>
              {createService.isError && (
                <Alert type="error" dismissible>
                  {(createService.error as Error)?.message || "Failed to create service"}
                </Alert>
              )}
              <SpaceBetween size="m">
                <FormField label="Service name" description="A unique name within the cluster.">
                  <Input
                    value={serviceForm.serviceName}
                    onChange={({ detail }) => setServiceForm((p) => ({ ...p, serviceName: detail.value }))}
                    placeholder="my-service"
                  />
                </FormField>
                <FormField
                  label="Task definition"
                  description="Select a task definition family (uses latest revision)."
                >
                  <Select
                    selectedOption={
                      serviceForm.taskDefinition
                        ? { label: serviceForm.taskDefinition, value: serviceForm.taskDefinition }
                        : { label: "Select task definition", value: "" }
                    }
                    onChange={({ detail }) =>
                      setServiceForm((p) => ({
                        ...p,
                        taskDefinition: detail.selectedOption?.value || "",
                      }))
                    }
                    options={(taskDefFamilies.data?.families || []).map((f: string) => ({ label: f, value: f }))}
                    placeholder="Select task definition"
                    filteringType="auto"
                  />
                </FormField>
                <FormField label="Desired count" description="Number of tasks to run.">
                  <Input
                    type="number"
                    value={String(serviceForm.desiredCount)}
                    onChange={({ detail }) =>
                      setServiceForm((p) => ({ ...p, desiredCount: Math.max(0, Number(detail.value) || 0) }))
                    }
                  />
                </FormField>
                <FormField label="Launch type">
                  <Select
                    selectedOption={{ label: serviceForm.launchType, value: serviceForm.launchType }}
                    onChange={({ detail }) =>
                      setServiceForm((p) => ({ ...p, launchType: detail.selectedOption?.value || "FARGATE" }))
                    }
                    options={[
                      { label: "FARGATE", value: "FARGATE" },
                      { label: "EC2", value: "EC2" },
                    ]}
                  />
                </FormField>
              </SpaceBetween>
            </Form>
          </Modal>
        </>
      ),
    },
    {
      label: `Tasks (${tasksQuery.data?.total || 0})`,
      id: "tasks",
      content: (
        <>
          <ResourceTable
            resourceName="Task"
            headerTitle="Tasks"
            headerCounter={tasksQuery.data?.total}
            items={tasksQuery.data?.tasks || []}
            columns={[
              { id: "arn", header: "Task ARN", cell: (item: any) => item.taskArn?.split("/").pop() || "—", isRowHeader: true },
              { id: "status", header: "Last Status", cell: (item: any) => <StatusBadge status={item.lastStatus || "UNKNOWN"} /> },
              { id: "desired", header: "Desired", cell: (item: any) => item.desiredStatus || "—" },
              { id: "taskDef", header: "Task Definition", cell: (item: any) => item.taskDefinitionArn?.split("/").pop() || "—" },
              { id: "group", header: "Group", cell: (item: any) => item.group || "—" },
              {
                id: "actions",
                header: "",
                cell: (item: any) =>
                  item.lastStatus !== "STOPPED" ? (
                    <Button
                      variant="link"
                      onClick={() =>
                        stopTask.mutateAsync({
                          cluster: clusterName,
                          task: item.taskArn,
                          reason: "Stopped via dashboard",
                        })
                      }
                    >
                      Stop
                    </Button>
                  ) : null,
              },
            ]}
            loading={tasksQuery.isLoading}
            emptyMessage="No running tasks in this cluster."
            onCreate={() => setShowRunTask(true)}
          />
          <Modal
            visible={showRunTask}
            onDismiss={() => setShowRunTask(false)}
            header="Run task"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowRunTask(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    loading={runTask.isPending}
                    disabled={!taskDefInput.trim()}
                    onClick={() => {
                      runTask.mutate(
                        { cluster: clusterName, taskDefinition: taskDefInput.trim(), count: 1 },
                        { onSuccess: () => { setShowRunTask(false); setTaskDefInput(""); } }
                      );
                    }}
                  >
                    Run
                  </Button>
                </SpaceBetween>
              </Box>
            }
          >
            <Form>
              {runTask.isError && (
                <Alert type="error" dismissible>
                  {(runTask.error as Error)?.message || "Failed to run task"}
                </Alert>
              )}
              <FormField label="Task definition" description="Family:revision or full ARN">
                <Input
                  value={taskDefInput}
                  onChange={({ detail }) => setTaskDefInput(detail.value)}
                  placeholder="my-task:1"
                />
              </FormField>
            </Form>
          </Modal>
        </>
      ),
    },
    {
      label: `Task Definitions (${taskDefsQuery.data?.total || 0})`,
      id: "task-defs",
      content: (
        <ResourceTable
          resourceName="Task Definition"
          headerTitle="Task Definitions"
          headerCounter={taskDefsQuery.data?.total}
          items={(taskDefsQuery.data?.taskDefinitionArns || []).map((arn: string) => ({ arn }))}
          columns={[
            { id: "arn", header: "Task Definition ARN", cell: (item: any) => item.arn.split("/").pop() || item.arn, isRowHeader: true },
          ]}
          loading={taskDefsQuery.isLoading}
          emptyMessage="No task definitions registered."
          filterEnabled
          filterPlaceholder="Find task definitions"
          filterFunction={(item: any, s: string) => (item.arn || "").toLowerCase().includes(s.toLowerCase())}
        />
      ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" onClick={onBack}>
        &larr; Clusters
      </Button>
      <Box variant="h2">{clusterName}</Box>
      <Tabs tabs={tabs} />
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  API Gateway
// ────────────────────────────────────────────────────────

function APIGatewayDashboard() {
  const { data, isLoading, isError, error } = useAPIGatewayApis();
  const createApi = useCreateAPIGatewayApi();
  const deleteApi = useDeleteAPIGatewayApi();
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({ name: "", description: "" });

  const apis = data?.apis || [];

  const columns = [
    { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
    { id: "id", header: "API ID", cell: (item: any) => item.id },
    { id: "description", header: "Description", cell: (item: any) => item.description || "—" },
    { id: "created", header: "Created", cell: (item: any) => item.createdDate ? new Date(item.createdDate).toLocaleDateString() : "—" },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedApi(item.id)}>
            View
          </Button>
          <DeleteButton
            itemName={item.name}
            resourceType="REST API"
            loading={deleteApi.isPending}
            onDelete={() => deleteApi.mutateAsync(item.id)}
          />
        </SpaceBetween>
      ),
    },
  ];

  if (selectedApi) {
    return <APIGatewayApiDetail apiId={selectedApi} onBack={() => setSelectedApi(null)} />;
  }

  return (
    <>
      <ResourceTable
        resourceName="REST API"
        headerTitle="API Gateway REST APIs"
        headerCounter={data?.total}
        items={apis}
        columns={columns}
        loading={isLoading}
        emptyMessage="No REST APIs found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find APIs by name"
        filterFunction={(item: any, searchText: string) =>
          (item.name || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create REST API"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createApi.isPending}
                disabled={!form.name.trim()}
                onClick={() => {
                  createApi.mutate(form, {
                    onSuccess: () => {
                      setShowCreate(false);
                      setForm({ name: "", description: "" });
                    },
                  });
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createApi.isError && (
            <Alert type="error" dismissible>
              {(createApi.error as Error)?.message || "Failed to create REST API"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="API name" description="A descriptive name for your REST API.">
              <Input
                value={form.name}
                onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))}
                placeholder="my-api"
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) => setForm((p) => ({ ...p, description: detail.value }))}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function APIGatewayApiDetail({ apiId, onBack }: { apiId: string; onBack: () => void }) {
  const { data: apiData, isLoading: apiLoading } = useAPIGatewayApi(apiId);
  const { data: resData, isLoading: resLoading, isError, error } = useAPIGatewayResources(apiId);
  const { data: deployData, isLoading: deployLoading } = useAPIGatewayDeployments(apiId);

  const resources = resData?.resources || [];
  const deployments = deployData?.deployments || [];

  const api = apiData?.api;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to REST APIs
      </Button>

      <Header variant="h2" description={api?.description || `API ID: ${apiId}`}>
        {api?.name || "REST API"}
      </Header>

      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load resources"}
        </StatusIndicator>
      )}

      <SpaceBetween size="xl">
        <Container header={<Header variant="h3">Resources</Header>}>
          <ResourceTable
            resourceName="Resource"
            items={resources}
            columns={[
              { id: "path", header: "Path", cell: (item: any) => item.path, isRowHeader: true },
              { id: "id", header: "Resource ID", cell: (item: any) => item.id },
              {
                id: "methods",
                header: "Methods",
                cell: (item: any) => {
                  const methods = Object.keys(item.resourceMethods || {});
                  return methods.length > 0 ? methods.join(", ") : "—";
                },
              },
            ]}
            loading={resLoading}
            emptyMessage="No resources found."
          />
        </Container>

        <Container header={<Header variant="h3">Deployments</Header>}>
          <ResourceTable
            resourceName="Deployment"
            items={deployments}
            columns={[
              { id: "id", header: "Deployment ID", cell: (item: any) => item.id, isRowHeader: true },
              { id: "stage", header: "Stage", cell: (item: any) => item.stageName || "—" },
              {
                id: "date",
                header: "Created",
                cell: (item: any) =>
                  item.createdDate ? new Date(item.createdDate).toLocaleString() : "—",
              },
              {
                id: "status",
                header: "Status",
                cell: (item: any) => item.apiSummary ? "—" : (item.statusDescription || "—"),
              },
            ]}
            loading={deployLoading}
            emptyMessage="No deployments found."
          />
        </Container>
      </SpaceBetween>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  AppSync
// ────────────────────────────────────────────────────────

const APPSYNC_AUTH_OPTIONS: SelectProps.Option[] = [
  { label: "API_KEY", value: "API_KEY" },
  { label: "AWS_IAM", value: "AWS_IAM" },
  { label: "AMAZON_COGNITO_USER_POOLS", value: "AMAZON_COGNITO_USER_POOLS" },
  { label: "OPENID_CONNECT", value: "OPENID_CONNECT" },
  { label: "AWS_LAMBDA", value: "AWS_LAMBDA" },
];

const APPSYNC_DS_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "NONE", value: "NONE" },
  { label: "AWS_LAMBDA", value: "AWS_LAMBDA" },
  { label: "AMAZON_DYNAMODB", value: "AMAZON_DYNAMODB" },
  { label: "HTTP", value: "HTTP" },
  { label: "AMAZON_EVENTBRIDGE", value: "AMAZON_EVENTBRIDGE" },
  { label: "RELATIONAL_DATABASE", value: "RELATIONAL_DATABASE" },
  { label: "AMAZON_OPENSEARCH_SERVICE", value: "AMAZON_OPENSEARCH_SERVICE" },
];

function AppSyncDashboard() {
  const { data, isLoading, isError, error } = useAppSyncApis();
  const createApi = useCreateAppSyncApi();
  const deleteApi = useDeleteAppSyncApi();
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", authenticationType: "API_KEY" });

  const apis = data?.apis || [];

  const columns = [
    { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
    { id: "apiId", header: "API ID", cell: (item: any) => item.apiId },
    { id: "auth", header: "Auth", cell: (item: any) => item.authenticationType || "—" },
    { id: "type", header: "Type", cell: (item: any) => item.apiType || "GRAPHQL" },
    { id: "dns", header: "GraphQL URL", cell: (item: any) => item.uris?.GRAPHQL || item.uris?.REALTIME || "—" },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedApi(item.apiId)}>
            View
          </Button>
          <DeleteButton
            itemName={item.name}
            resourceType="GraphQL API"
            loading={deleteApi.isPending}
            onDelete={() => deleteApi.mutateAsync(item.apiId)}
          />
        </SpaceBetween>
      ),
    },
  ];

  if (selectedApi) {
    return <AppSyncApiDetail apiId={selectedApi} onBack={() => setSelectedApi(null)} />;
  }

  return (
    <>
      <ResourceTable
        resourceName="GraphQL API"
        headerTitle="AppSync GraphQL APIs"
        headerCounter={data?.total}
        items={apis}
        columns={columns}
        loading={isLoading}
        emptyMessage="No GraphQL APIs found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find APIs by name"
        filterFunction={(item: any, searchText: string) =>
          (item.name || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create GraphQL API"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createApi.isPending}
                disabled={!form.name.trim()}
                onClick={() => {
                  createApi.mutate(form, {
                    onSuccess: () => {
                      setShowCreate(false);
                      setForm({ name: "", authenticationType: "API_KEY" });
                    },
                  });
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createApi.isError && (
            <Alert type="error" dismissible>
              {(createApi.error as Error)?.message || "Failed to create GraphQL API"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="API name" description="A descriptive name for your GraphQL API.">
              <Input
                value={form.name}
                onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))}
                placeholder="my-graphql-api"
              />
            </FormField>
            <FormField label="Authentication type">
              <Select
                selectedOption={{ label: form.authenticationType, value: form.authenticationType }}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, authenticationType: detail.selectedOption?.value || "API_KEY" }))
                }
                options={APPSYNC_AUTH_OPTIONS}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function AppSyncApiDetail({ apiId, onBack }: { apiId: string; onBack: () => void }) {
  const { data: apiData, isLoading: apiLoading } = useAppSyncApi(apiId);
  const { data: dsData, isLoading: dsLoading } = useAppSyncDataSources(apiId);
  const { data: resolverData, isLoading: resolverLoading } = useAppSyncResolvers(apiId);
  const { data: funcData, isLoading: funcLoading } = useAppSyncFunctions(apiId);
  const { data: keyData, isLoading: keyLoading } = useAppSyncApiKeys(apiId);
  const { data: typeData, isLoading: typeLoading } = useAppSyncTypes(apiId);
  const createDs = useCreateAppSyncDataSource();
  const deleteDs = useDeleteAppSyncDataSource();
  const createFunc = useCreateAppSyncFunction();
  const deleteFunc = useDeleteAppSyncFunction();
  const createKey = useCreateAppSyncApiKey();
  const deleteKey = useDeleteAppSyncApiKey();
  const { showToast } = useToast();
  const [showCreateDs, setShowCreateDs] = useState(false);
  const [showCreateFunc, setShowCreateFunc] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [dsForm, setDsForm] = useState({ name: "", type: "NONE", description: "" });
  const [funcForm, setFuncForm] = useState({ name: "", dataSourceName: "", code: "" });

  const api = apiData?.api;
  const dataSources = dsData?.dataSources || [];
  const resolvers = resolverData?.resolvers || [];
  const functions = funcData?.functions || [];
  const apiKeys = keyData?.apiKeys || [];
  const types = typeData?.types || [];

  const tabs: TabsProps.Tab[] = [
    {
      label: `Data Sources (${dataSources.length})`,
      id: "data-sources",
      content: (
        <ResourceTable
          resourceName="Data Source"
          headerTitle="Data Sources"
          headerCounter={dataSources.length}
          items={dataSources}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "type", header: "Type", cell: (item: any) => item.type || "—" },
            { id: "desc", header: "Description", cell: (item: any) => item.description || "—" },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.name}
                  resourceType="data source"
                  loading={deleteDs.isPending}
                  onDelete={() => deleteDs.mutateAsync({ apiId, name: item.name })}
                />
              ),
            },
          ]}
          loading={dsLoading}
          emptyMessage="No data sources."
          onCreate={() => setShowCreateDs(true)}
        />
      ),
    },
    {
      label: `Resolvers (${resolvers.length})`,
      id: "resolvers",
      content: (
        <ResourceTable
          resourceName="Resolver"
          headerTitle="Resolvers"
          headerCounter={resolvers.length}
          items={resolvers}
          columns={[
            { id: "field", header: "Field", cell: (item: any) => item.fieldName, isRowHeader: true },
            { id: "type", header: "Type", cell: (item: any) => item.typeName },
            { id: "ds", header: "Data Source", cell: (item: any) => item.dataSourceName || "—" },
            { id: "kind", header: "Kind", cell: (item: any) => item.kind || "UNIT" },
            { id: "runtime", header: "Runtime", cell: (item: any) => item.runtime?.name || "—" },
          ]}
          loading={resolverLoading}
          emptyMessage="No resolvers."
        />
      ),
    },
    {
      label: `Functions (${functions.length})`,
      id: "functions",
      content: (
        <ResourceTable
          resourceName="Function"
          headerTitle="Functions"
          headerCounter={functions.length}
          items={functions}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "id", header: "Function ID", cell: (item: any) => item.functionId },
            { id: "ds", header: "Data Source", cell: (item: any) => item.dataSourceName || "—" },
            { id: "version", header: "Version", cell: (item: any) => item.functionVersion || "—" },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.name}
                  resourceType="function"
                  loading={deleteFunc.isPending}
                  onDelete={() => deleteFunc.mutateAsync({ apiId, functionId: item.functionId })}
                />
              ),
            },
          ]}
          loading={funcLoading}
          emptyMessage="No functions."
          onCreate={() => setShowCreateFunc(true)}
        />
      ),
    },
    {
      label: `API Keys (${apiKeys.length})`,
      id: "api-keys",
      content: (
        <ResourceTable
          resourceName="API Key"
          headerTitle="API Keys"
          headerCounter={apiKeys.length}
          items={apiKeys}
          columns={[
            { id: "id", header: "Key ID", cell: (item: any) => item.id, isRowHeader: true },
            { id: "desc", header: "Description", cell: (item: any) => item.description || "—" },
            {
              id: "expires",
              header: "Expires",
              cell: (item: any) => (item.expires ? new Date(item.expires * 1000).toLocaleString() : "—"),
            },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.id}
                  resourceType="API key"
                  loading={deleteKey.isPending}
                  onDelete={() => deleteKey.mutateAsync({ apiId, id: item.id })}
                />
              ),
            },
          ]}
          loading={keyLoading}
          emptyMessage="No API keys."
          onCreate={() =>
            createKey.mutate(
              { apiId },
              {
                onSuccess: (data: any) => {
                  showToast("success", "API key created");
                  setNewApiKey(data?.apiKey ?? "Key not returned");
                },
                onError: (err) => showToast("error", (err as Error).message),
              }
            )
          }
        />
      ),
    },
    {
      label: `Types (${types.length})`,
      id: "types",
      content: (
        <ResourceTable
          resourceName="Type"
          headerTitle="Types"
          headerCounter={types.length}
          items={types}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "format", header: "Format", cell: (item: any) => item.format || "SDL" },
          ]}
          loading={typeLoading}
          emptyMessage="No types defined."
        />
      ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to GraphQL APIs
      </Button>

      <Header variant="h2" description={api?.apiId ? `API ID: ${api.apiId}` : undefined}>
        {apiLoading ? "Loading…" : api?.name || "GraphQL API"}
      </Header>

      {api && (
        <ColumnLayout columns={3}>
          <Container header={<Header variant="h3">Authentication</Header>}>
            <Box>{api.authenticationType || "—"}</Box>
          </Container>
          <Container header={<Header variant="h3">API Type</Header>}>
            <Box>{api.apiType || "GRAPHQL"}</Box>
          </Container>
          <Container header={<Header variant="h3">X-Ray</Header>}>
            <Box>{api.xrayEnabled ? "Enabled" : "Disabled"}</Box>
          </Container>
        </ColumnLayout>
      )}

      <Tabs tabs={tabs} />

      <Modal
        visible={showCreateDs}
        onDismiss={() => setShowCreateDs(false)}
        header="Create data source"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateDs(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createDs.isPending}
                disabled={!dsForm.name.trim()}
                onClick={() => {
                  createDs.mutate(
                    { apiId, ...dsForm },
                    {
                      onSuccess: () => {
                        setShowCreateDs(false);
                        setDsForm({ name: "", type: "NONE", description: "" });
                      },
                      onError: (err) => showToast("error", (err as Error).message),
                    }
                  );
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={dsForm.name}
                onChange={({ detail }) => setDsForm((p) => ({ ...p, name: detail.value }))}
                placeholder="my-datasource"
              />
            </FormField>
            <FormField label="Type">
              <Select
                selectedOption={{ label: dsForm.type, value: dsForm.type }}
                onChange={({ detail }) => setDsForm((p) => ({ ...p, type: detail.selectedOption?.value || "NONE" }))}
                options={APPSYNC_DS_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={dsForm.description}
                onChange={({ detail }) => setDsForm((p) => ({ ...p, description: detail.value }))}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal
        visible={showCreateFunc}
        onDismiss={() => setShowCreateFunc(false)}
        header="Create function"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateFunc(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createFunc.isPending}
                disabled={!funcForm.name.trim() || !funcForm.dataSourceName.trim()}
                onClick={() => {
                  createFunc.mutate(
                    { apiId, ...funcForm },
                    {
                      onSuccess: () => {
                        setShowCreateFunc(false);
                        setFuncForm({ name: "", dataSourceName: "", code: "" });
                      },
                      onError: (err) => showToast("error", (err as Error).message),
                    }
                  );
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={funcForm.name}
                onChange={({ detail }) => setFuncForm((p) => ({ ...p, name: detail.value }))}
                placeholder="my-function"
              />
            </FormField>
            <FormField label="Data source name">
              <Select
                selectedOption={
                  funcForm.dataSourceName
                    ? { label: funcForm.dataSourceName, value: funcForm.dataSourceName }
                    : { label: "Select data source", value: "" }
                }
                onChange={({ detail }) =>
                  setFuncForm((p) => ({ ...p, dataSourceName: detail.selectedOption?.value || "" }))
                }
                options={dataSources.map((ds: any) => ({ label: ds.name, value: ds.name }))}
                placeholder="Select data source"
                filteringType="auto"
              />
            </FormField>
            <FormField label="Code (optional)" description="JavaScript runtime code (APPSYNC_JS).">
              <Input
                value={funcForm.code}
                onChange={({ detail }) => setFuncForm((p) => ({ ...p, code: detail.value }))}
                placeholder="export function request(ctx) { return {}; }"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal
        visible={!!newApiKey}
        onDismiss={() => setNewApiKey(null)}
        header="API Key Created"
        footer={
          <Box float="right">
            <Button variant="primary" onClick={() => setNewApiKey(null)}>
              Done
            </Button>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="warning">
            Copy your API key now. For security reasons, the full key value is only shown once and cannot be retrieved later.
          </Alert>
          <FormField label="API Key">
            <Input
              value={newApiKey || ""}
              readOnly
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  EventBridge Scheduler
// ────────────────────────────────────────────────────────

function SchedulerDashboard() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (selectedGroup) {
    return (
      <SchedulerGroupDetail
        groupName={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return <SchedulerGroupList onSelectGroup={(name) => setSelectedGroup(name)} />;
}

function SchedulerGroupList({ onSelectGroup }: { onSelectGroup: (name: string) => void }) {
  const { data, isLoading, isError, error } = useSchedulerGroups();
  const createGroup = useCreateSchedulerGroup();
  const deleteGroup = useDeleteSchedulerGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");

  const groups = data?.groups || [];

  const columns = [
    { id: "name", header: "Group Name", cell: (item: any) => item.Name, isRowHeader: true },
    {
      id: "state",
      header: "State",
      cell: (item: any) => <StatusBadge status={item.State || "ACTIVE"} />,
    },
    {
      id: "created",
      header: "Created",
      cell: (item: any) =>
        item.CreationDate ? new Date(item.CreationDate).toLocaleString() : "—",
    },
    {
      id: "schedules",
      header: "Schedules",
      cell: (item: any) => <GroupScheduleCount groupName={item.Name} />,
    },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          {item.Name !== "default" && (
            <DeleteButton
              itemName={item.Name}
              resourceType="schedule group"
              loading={deleteGroup.isPending}
              onDelete={() => deleteGroup.mutateAsync(item.Name)}
            />
          )}
        </SpaceBetween>
      ),
    },
  ];

  return (
    <>
      <ResourceTable
        resourceName="Schedule Group"
        headerTitle="EventBridge Scheduler — Schedule Groups"
        headerCounter={data?.total}
        items={groups}
        columns={columns}
        loading={isLoading}
        emptyMessage="No schedule groups found."
        filterEnabled
        filterPlaceholder="Find groups by name"
        filterFunction={(item: any, s: string) =>
          (item.Name || "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create schedule group"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createGroup.isPending}
                disabled={!groupName.trim()}
                onClick={() => {
                  createGroup.mutate(
                    { name: groupName.trim() },
                    {
                      onSuccess: () => {
                        setShowCreate(false);
                        setGroupName("");
                      },
                    }
                  );
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createGroup.isError && (
            <Alert type="error" dismissible>
              {(createGroup.error as Error)?.message || "Failed to create schedule group"}
            </Alert>
          )}
          <FormField label="Group name">
            <Input
              value={groupName}
              onChange={({ detail }) => setGroupName(detail.value)}
              placeholder="my-schedule-group"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

function GroupScheduleCount({ groupName }: { groupName: string }) {
  const { data } = useSchedules(groupName);
  return <span>{data?.total ?? "…"}</span>;
}

function SchedulerGroupDetail({
  groupName,
  onBack,
}: {
  groupName: string;
  onBack: () => void;
}) {
  const { data, isLoading } = useSchedules(groupName);
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    scheduleExpression: "rate(1 minute)",
    description: "",
    targetArn: "",
    targetRoleArn: "",
  });

  const schedules = data?.schedules || [];

  const columns = [
    { id: "name", header: "Schedule Name", cell: (item: any) => item.Name, isRowHeader: true },
    { id: "expr", header: "Expression", cell: (item: any) => (
      <span style={{ fontFamily: "monospace", fontSize: "0.85em" }}>{item.ScheduleExpression}</span>
    ) },
    { id: "state", header: "State", cell: (item: any) => <StatusBadge status={item.State || "ENABLED"} /> },
    { id: "target", header: "Target", cell: (item: any) => item.Target?.Arn?.split(":").pop() || item.Target?.Arn || "—" },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <DeleteButton
          itemName={item.Name}
          resourceType="schedule"
          loading={deleteSchedule.isPending}
          onDelete={() => deleteSchedule.mutateAsync({ name: item.Name, group: groupName })}
        />
      ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Schedule Groups
      </Button>

      <Header variant="h2" description={`Group: ${groupName}`}>
        Schedules
      </Header>

      <ResourceTable
        resourceName="Schedule"
        headerTitle="Schedules"
        headerCounter={data?.total}
        items={schedules}
        columns={columns}
        loading={isLoading}
        emptyMessage="No schedules in this group."
        filterEnabled
        filterPlaceholder="Find schedules by name"
        filterFunction={(item: any, s: string) =>
          (item.Name || "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create schedule"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createSchedule.isPending}
                disabled={!form.name.trim() || !form.targetArn.trim()}
                onClick={() => {
                  createSchedule.mutate(
                    {
                      name: form.name.trim(),
                      groupName,
                      scheduleExpression: form.scheduleExpression.trim(),
                      description: form.description.trim() || undefined,
                      target: {
                        arn: form.targetArn.trim(),
                        roleArn: form.targetRoleArn.trim() || undefined,
                      },
                    },
                    {
                      onSuccess: () => {
                        setShowCreate(false);
                        setForm({
                          name: "",
                          scheduleExpression: "rate(1 minute)",
                          description: "",
                          targetArn: "",
                          targetRoleArn: "",
                        });
                      },
                    }
                  );
                }}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createSchedule.isError && (
            <Alert type="error" dismissible>
              {(createSchedule.error as Error)?.message || "Failed to create schedule"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Schedule name">
              <Input
                value={form.name}
                onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))}
                placeholder="my-schedule"
              />
            </FormField>
            <FormField
              label="Schedule expression"
              description="rate(1 minute), cron(0 12 * * ? *), or at(2024-01-01T00:00:00)"
            >
              <Input
                value={form.scheduleExpression}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, scheduleExpression: detail.value }))
                }
                placeholder="rate(5 minutes)"
              />
            </FormField>
            <FormField label="Target ARN" description="Lambda function, SQS queue, SNS topic, or Step Function ARN.">
              <Input
                value={form.targetArn}
                onChange={({ detail }) => setForm((p) => ({ ...p, targetArn: detail.value }))}
                placeholder="arn:aws:lambda:us-east-1:123456789012:function:my-fn"
              />
            </FormField>
            <FormField label="Role ARN (optional)" description="IAM role for the scheduler to assume.">
              <Input
                value={form.targetRoleArn}
                onChange={({ detail }) => setForm((p) => ({ ...p, targetRoleArn: detail.value }))}
                placeholder="arn:aws:iam::123456789012:role/scheduler-role"
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) => setForm((p) => ({ ...p, description: detail.value }))}
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
            cell: (item: any) => formatBytes(item.storedBytes ?? 0),
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
          backgroundColor: "var(--color-background-container-content, #ffffff)",
          border: "1px solid var(--color-border-divider-default, #e9ebed)",
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
                color: "var(--color-text-link-default, #0073bb)",
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
                color: "var(--color-text-body-default, #16191f)",
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

// ────────────────────────────────────────────────────────
//  ECR
// ────────────────────────────────────────────────────────

function ECRDashboard() {
  const { data, isLoading } = useECRRepositories();
  const createRepo = useECRCreateRepository();
  const deleteRepo = useECRDeleteRepository();
  const [showCreate, setShowCreate] = useState(false);
  const [repoName, setRepoName] = useState("");

  if (isLoading) return <Spinner />;

  return (
    <>
      <ResourceTable
        resourceName="Repository"
        headerTitle="Repositories"
        headerCounter={data?.total}
        items={(data?.repositories || []).map((r: any) => ({
          name: r.repositoryName,
          uri: r.repositoryUri,
          created: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-",
        }))}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        emptyMessage="No repositories"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => item.name,
            isRowHeader: true,
          },
          { id: "uri", header: "URI", cell: (item: any) => item.uri },
          { id: "created", header: "Created", cell: (item: any) => item.created },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="repository"
                loading={deleteRepo.isPending && deleteRepo.variables === item.name}
                onDelete={() => deleteRepo.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find repositories by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create repository"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  createRepo.mutate({ name: repoName });
                  setShowCreate(false);
                  setRepoName("");
                }}
                disabled={!repoName}
                loading={createRepo.isPending}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Repository name">
            <Input
              value={repoName}
              onChange={({ detail }) => setRepoName(detail.value)}
              placeholder="my-repo"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  ELB
// ────────────────────────────────────────────────────────

function ELBDashboard() {
  const { data: lbs, isLoading: lbsLoading } = useELBLoadBalancers();
  const { data: tgs, isLoading: tgsLoading } = useELBTargetGroups();
  const createLB = useELBCreateLoadBalancer();
  const deleteLB = useELBDeleteLoadBalancer();
  const createTG = useELBCreateTargetGroup();
  const deleteTG = useELBDeleteTargetGroup();
  const [activeTab, setActiveTab] = useState("load-balancers");
  const [showCreateLB, setShowCreateLB] = useState(false);
  const [showCreateTG, setShowCreateTG] = useState(false);
  const [lbName, setLBName] = useState("");
  const [tgName, setTGName] = useState("");
  const [tgProtocol, setTGProtocol] = useState<SelectProps.Option>({ label: "HTTP", value: "HTTP" });
  const [tgPort, setTGPort] = useState("80");

  const PROTOCOL_OPTIONS: SelectProps.Option[] = [
    { label: "HTTP", value: "HTTP" },
    { label: "HTTPS", value: "HTTPS" },
    { label: "TCP", value: "TCP" },
    { label: "TLS", value: "TLS" },
    { label: "UDP", value: "UDP" },
    { label: "TCP_UDP", value: "TCP_UDP" },
  ];

  if (lbsLoading || tgsLoading) return <Spinner />;

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      tabs={[
        {
          id: "load-balancers",
          label: "Load Balancers",
          content: (
            <>
              <ResourceTable
                resourceName="Load Balancer"
                headerTitle="Load Balancers"
                headerCounter={lbs?.total}
                items={(lbs?.loadBalancers || []).map((lb: any) => ({
                  name: lb.loadBalancerName,
                  arn: lb.loadBalancerArn,
                  type: lb.type,
                  scheme: lb.scheme,
                  state: lb.state?.Code || "unknown",
                }))}
                loading={lbsLoading}
                onCreate={() => setShowCreateLB(true)}
                emptyMessage="No load balancers"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (item: any) => item.name,
                    isRowHeader: true,
                  },
                  { id: "type", header: "Type", cell: (item: any) => item.type },
                  { id: "scheme", header: "Scheme", cell: (item: any) => item.scheme },
                  { id: "state", header: "State", cell: (item: any) => item.state },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="load balancer"
                        loading={deleteLB.isPending && deleteLB.variables === item.arn}
                        onDelete={() => deleteLB.mutateAsync(item.arn)}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find load balancers by name"
                filterFunction={(item: any, searchText: string) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase())
                }
              />
              <Modal
                visible={showCreateLB}
                onDismiss={() => setShowCreateLB(false)}
                header="Create load balancer"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowCreateLB(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          createLB.mutate({
                            name: lbName,
                            type: "application",
                            scheme: "internet-facing",
                            subnets: ["subnet-12345678"],
                          });
                          setShowCreateLB(false);
                          setLBName("");
                        }}
                        disabled={!lbName}
                        loading={createLB.isPending}
                      >
                        Create
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Load balancer name">
                    <Input
                      value={lbName}
                      onChange={({ detail }) => setLBName(detail.value)}
                      placeholder="my-lb"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ),
        },
        {
          id: "target-groups",
          label: "Target Groups",
          content: (
            <>
              <ResourceTable
                resourceName="Target Group"
                headerTitle="Target Groups"
                headerCounter={tgs?.total}
                items={(tgs?.targetGroups || []).map((tg: any) => ({
                  name: tg.targetGroupName,
                  arn: tg.targetGroupArn,
                  protocol: tg.protocol || "-",
                  port: tg.port || "-",
                  targetType: tg.targetType || "-",
                }))}
                loading={tgsLoading}
                onCreate={() => setShowCreateTG(true)}
                emptyMessage="No target groups"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (item: any) => item.name,
                    isRowHeader: true,
                  },
                  { id: "protocol", header: "Protocol", cell: (item: any) => item.protocol },
                  { id: "port", header: "Port", cell: (item: any) => item.port },
                  { id: "targetType", header: "Target Type", cell: (item: any) => item.targetType },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="target group"
                        loading={deleteTG.isPending && deleteTG.variables === item.arn}
                        onDelete={() => deleteTG.mutateAsync(item.arn)}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find target groups by name"
                filterFunction={(item: any, searchText: string) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase())
                }
              />
              <Modal
                visible={showCreateTG}
                onDismiss={() => setShowCreateTG(false)}
                header="Create target group"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowCreateTG(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          createTG.mutate({
                            name: tgName,
                            protocol: tgProtocol.value as string,
                            port: parseInt(tgPort),
                            vpcId: "vpc-default",
                          });
                          setShowCreateTG(false);
                          setTGName("");
                        }}
                        disabled={!tgName}
                        loading={createTG.isPending}
                      >
                        Create
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Target group name">
                    <Input
                      value={tgName}
                      onChange={({ detail }) => setTGName(detail.value)}
                      placeholder="my-tg"
                    />
                  </FormField>
                  <FormField label="Protocol">
                    <Select
                      selectedOption={tgProtocol}
                      onChange={({ detail }) => setTGProtocol(detail.selectedOption)}
                      options={PROTOCOL_OPTIONS}
                    />
                  </FormField>
                  <FormField label="Port">
                    <Input
                      value={tgPort}
                      onChange={({ detail }) => setTGPort(detail.value)}
                      inputMode="numeric"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  SES
// ────────────────────────────────────────────────────────

function SESDashboard() {
  const { data, isLoading } = useSESIdentities();
  const verifyEmail = useSESVerifyEmail();
  const verifyDomain = useSESVerifyDomain();
  const deleteIdentity = useSESDeleteIdentity();
  const sendEmail = useSESSendEmail();
  const { data: verifiedEmails } = useSESVerifiedEmails();
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [showVerifyDomain, setShowVerifyDomain] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [domain, setDomain] = useState("");
  const [sendFrom, setSendFrom] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");

  if (isLoading) return <Spinner />;

  return (
    <>
      <ResourceTable
        resourceName="Email Identity"
        headerTitle="Email Identities"
        headerCounter={data?.total}
        items={(data?.identities || []).map((id: any) => ({
          identity: id.identity,
          status: id.verificationStatus || "Pending",
          dkim: id.dkimEnabled ? "Enabled" : "Disabled",
          mailFrom: id.mailFromDomain || "-",
        }))}
        loading={isLoading}
        onCreate={() => setShowVerifyEmail(true)}
        emptyMessage="No email identities"
        columns={[
          {
            id: "identity",
            header: "Identity",
            cell: (item: any) => item.identity,
            isRowHeader: true,
          },
          { id: "status", header: "Status", cell: (item: any) => item.status },
          { id: "dkim", header: "DKIM", cell: (item: any) => item.dkim },
          { id: "mailFrom", header: "Mail From", cell: (item: any) => item.mailFrom },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.identity}
                resourceType="identity"
                loading={deleteIdentity.isPending && deleteIdentity.variables === item.identity}
                onDelete={() => deleteIdentity.mutateAsync(item.identity)}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find identities"
        filterFunction={(item: any, searchText: string) =>
          item.identity.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      {verifiedEmails && verifiedEmails.emails.length > 0 && (
        <Container header={<Header variant="h2">Verified Emails</Header>}>
          <Box>
            {verifiedEmails.emails.map((email: string) => (
              <div key={email}>{email}</div>
            ))}
          </Box>
        </Container>
      )}
      <Modal
        visible={showVerifyEmail}
        onDismiss={() => setShowVerifyEmail(false)}
        header="Verify email address"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowVerifyEmail(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  verifyEmail.mutate(emailAddress);
                  setShowVerifyEmail(false);
                  setEmailAddress("");
                }}
                disabled={!emailAddress}
                loading={verifyEmail.isPending}
              >
                Verify
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Email address">
            <Input
              value={emailAddress}
              onChange={({ detail }) => setEmailAddress(detail.value)}
              placeholder="user@example.com"
            />
          </FormField>
        </Form>
      </Modal>
      <Modal
        visible={showVerifyDomain}
        onDismiss={() => setShowVerifyDomain(false)}
        header="Verify domain"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowVerifyDomain(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  verifyDomain.mutate(domain);
                  setShowVerifyDomain(false);
                  setDomain("");
                }}
                disabled={!domain}
                loading={verifyDomain.isPending}
              >
                Verify
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Domain name">
            <Input
              value={domain}
              onChange={({ detail }) => setDomain(detail.value)}
              placeholder="example.com"
            />
          </FormField>
        </Form>
      </Modal>
      <Modal
        visible={showSendEmail}
        onDismiss={() => setShowSendEmail(false)}
        header="Send email"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowSendEmail(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  sendEmail.mutate({
                    source: sendFrom,
                    toAddresses: sendTo.split(",").map((s) => s.trim()),
                    subject: sendSubject,
                    text: sendBody,
                  });
                  setShowSendEmail(false);
                  setSendFrom("");
                  setSendTo("");
                  setSendSubject("");
                  setSendBody("");
                }}
                disabled={!sendFrom || !sendTo || !sendSubject || !sendBody}
                loading={sendEmail.isPending}
              >
                Send
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="From (verified email)">
            <Input
              value={sendFrom}
              onChange={({ detail }) => setSendFrom(detail.value)}
              placeholder="sender@example.com"
            />
          </FormField>
          <FormField label="To (comma-separated)">
            <Input
              value={sendTo}
              onChange={({ detail }) => setSendTo(detail.value)}
              placeholder="recipient@example.com"
            />
          </FormField>
          <FormField label="Subject">
            <Input
              value={sendSubject}
              onChange={({ detail }) => setSendSubject(detail.value)}
              placeholder="Test email"
            />
          </FormField>
          <FormField label="Body (text)">
            <Textarea
              value={sendBody}
              onChange={({ detail }) => setSendBody(detail.value)}
              placeholder="Hello from SES"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  STS
// ────────────────────────────────────────────────────────

function STSDashboard() {
  const { data: identity, isLoading } = useSTSCallerIdentity();
  const assumeRole = useSTSAssumeRole();
  const getSessionToken = useSTSGetSessionToken();
  const [activeTab, setActiveTab] = useState("identity");
  const [showAssumeRole, setShowAssumeRole] = useState(false);
  const [showSessionToken, setShowSessionToken] = useState(false);
  const [roleArn, setRoleArn] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [duration, setDuration] = useState("");
  const [assumeResult, setAssumeResult] = useState<any>(null);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [sessionDuration, setSessionDuration] = useState("");

  if (isLoading) return <Spinner />;

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      tabs={[
        {
          id: "identity",
          label: "Caller Identity",
          content: (
            <SpaceBetween size="l">
              <Container header={<Header variant="h2">Current Caller Identity</Header>}>
                <ColumnLayout columns={3} variant="text-grid">
                  <div>
                    <Box variant="h4" color="text-body-secondary">Account</Box>
                    <Box>{identity?.account || "—"}</Box>
                  </div>
                  <div>
                    <Box variant="h4" color="text-body-secondary">User ID</Box>
                    <Box>{identity?.userId || "—"}</Box>
                  </div>
                  <div>
                    <Box variant="h4" color="text-body-secondary">ARN</Box>
                    <Box>{identity?.arn || "—"}</Box>
                  </div>
                </ColumnLayout>
              </Container>
            </SpaceBetween>
          ),
        },
        {
          id: "assume-role",
          label: "Assume Role",
          content: (
            <SpaceBetween size="l">
              <Container
                header={
                  <Header
                    variant="h2"
                    actions={<Button variant="primary" onClick={() => setShowAssumeRole(true)}>Assume role</Button>}
                  >
                    Assume Role
                  </Header>
                }
              >
                {assumeResult ? (
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="h4" color="text-body-secondary">Access Key ID</Box>
                      <Box>{assumeResult.credentials?.accessKeyId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Secret Access Key</Box>
                      <Box>{assumeResult.credentials?.secretAccessKey || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Session Token</Box>
                      <Box>{assumeResult.credentials?.sessionToken || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Expiration</Box>
                      <Box>{assumeResult.credentials?.expiration ? new Date(assumeResult.credentials.expiration).toLocaleString() : "—"}</Box>
                    </div>
                    {assumeResult.assumedRoleUser && (
                      <>
                        <div>
                          <Box variant="h4" color="text-body-secondary">Assumed Role ID</Box>
                          <Box>{assumeResult.assumedRoleUser.assumedRoleId || "—"}</Box>
                        </div>
                        <div>
                          <Box variant="h4" color="text-body-secondary">Assumed Role ARN</Box>
                          <Box>{assumeResult.assumedRoleUser.arn || "—"}</Box>
                        </div>
                      </>
                    )}
                  </ColumnLayout>
                ) : (
                  <Box variant="p" color="text-body-secondary">No role assumed yet. Click "Assume role" to get temporary credentials.</Box>
                )}
              </Container>
              <Modal
                visible={showAssumeRole}
                onDismiss={() => setShowAssumeRole(false)}
                header="Assume role"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowAssumeRole(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        disabled={!roleArn}
                        loading={assumeRole.isPending}
                        onClick={() => {
                          assumeRole.mutate(
                            {
                              roleArn,
                              sessionName: sessionName || undefined,
                              durationSeconds: duration ? parseInt(duration) : undefined,
                            },
                            {
                              onSuccess: (data) => {
                                setAssumeResult(data);
                                setShowAssumeRole(false);
                              },
                            }
                          );
                        }}
                      >
                        Assume
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <SpaceBetween size="m">
                    <FormField label="Role ARN">
                      <Input value={roleArn} onChange={({ detail }) => setRoleArn(detail.value)} placeholder="arn:aws:iam::123456789012:role/my-role" />
                    </FormField>
                    <FormField label="Session name (optional)">
                      <Input value={sessionName} onChange={({ detail }) => setSessionName(detail.value)} placeholder="dashboard-session" />
                    </FormField>
                    <FormField label="Duration seconds (optional)">
                      <Input value={duration} onChange={({ detail }) => setDuration(detail.value)} placeholder="3600" inputMode="numeric" />
                    </FormField>
                  </SpaceBetween>
                </Form>
              </Modal>
            </SpaceBetween>
          ),
        },
        {
          id: "session-token",
          label: "Session Token",
          content: (
            <SpaceBetween size="l">
              <Container
                header={
                  <Header
                    variant="h2"
                    actions={<Button variant="primary" onClick={() => setShowSessionToken(true)}>Get session token</Button>}
                  >
                    Session Token
                  </Header>
                }
              >
                {sessionResult ? (
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="h4" color="text-body-secondary">Access Key ID</Box>
                      <Box>{sessionResult.credentials?.accessKeyId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Secret Access Key</Box>
                      <Box>{sessionResult.credentials?.secretAccessKey || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Session Token</Box>
                      <Box>{sessionResult.credentials?.sessionToken || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Expiration</Box>
                      <Box>{sessionResult.credentials?.expiration ? new Date(sessionResult.credentials.expiration).toLocaleString() : "—"}</Box>
                    </div>
                  </ColumnLayout>
                ) : (
                  <Box variant="p" color="text-body-secondary">No session token requested. Click "Get session token" to obtain temporary credentials.</Box>
                )}
              </Container>
              <Modal
                visible={showSessionToken}
                onDismiss={() => setShowSessionToken(false)}
                header="Get session token"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowSessionToken(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        loading={getSessionToken.isPending}
                        onClick={() => {
                          getSessionToken.mutate(
                            {
                              durationSeconds: sessionDuration ? parseInt(sessionDuration) : undefined,
                            },
                            {
                              onSuccess: (data) => {
                                setSessionResult(data);
                                setShowSessionToken(false);
                              },
                            }
                          );
                        }}
                      >
                        Get token
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Duration seconds (optional)">
                    <Input value={sessionDuration} onChange={({ detail }) => setSessionDuration(detail.value)} placeholder="3600" inputMode="numeric" />
                  </FormField>
                </Form>
              </Modal>
            </SpaceBetween>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  EKS
// ────────────────────────────────────────────────────────

function EKSDashboard() {
  const { data: clustersData, isLoading: clustersLoading } = useEKSClusters();
  const createCluster = useEKSCreateCluster();
  const deleteCluster = useEKSDeleteCluster();
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [clusterName, setClusterName] = useState("");
  const [clusterRoleArn, setClusterRoleArn] = useState("");
  const [clusterVersion, setClusterVersion] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const { data: nodegroupsData, isLoading: nodegroupsLoading } = useEKSNodegroups(selectedCluster);
  const createNodegroup = useEKSCreateNodegroup(selectedCluster || "");
  const deleteNodegroup = useEKSDeleteNodegroup(selectedCluster || "");
  const [showCreateNodegroup, setShowCreateNodegroup] = useState(false);
  const [ngName, setNgName] = useState("");
  const [ngNodeRole, setNgNodeRole] = useState("");
  const [ngSubnets, setNgSubnets] = useState("");

  if (clustersLoading) return <Spinner />;

  return (
    <Tabs
      activeTabId={selectedCluster ? "nodegroups" : "clusters"}
      onChange={({ detail }) => {
        if (detail.activeTabId === "clusters") {
          setSelectedCluster(null);
        }
      }}
      tabs={[
        {
          id: "clusters",
          label: "Clusters",
          content: (
            <>
              {selectedCluster && (
                <Box margin={{ bottom: "s" }}>
                  <Button
                    iconName="arrow-left"
                    onClick={() => setSelectedCluster(null)}
                  >
                    Back to clusters
                  </Button>
                </Box>
              )}
              {!selectedCluster && (
                <>
                  <ResourceTable
                    resourceName="Cluster"
                    headerTitle="EKS Clusters"
                    headerCounter={clustersData?.total}
                    items={(clustersData?.clusters || []).map((c: any) => ({
                      name: c.name,
                      status: c.status,
                      version: c.version || "-",
                      endpoint: c.endpoint || "-",
                      created: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-",
                    }))}
                    loading={clustersLoading}
                    onCreate={() => setShowCreateCluster(true)}
                    emptyMessage="No EKS clusters"
                    columns={[
                      {
                        id: "name",
                        header: "Name",
                        cell: (item: any) => (
                          <Button
                            variant="link"
                            onClick={() => setSelectedCluster(item.name)}
                          >
                            {item.name}
                          </Button>
                        ),
                        isRowHeader: true,
                      },
                      { id: "status", header: "Status", cell: (item: any) => item.status },
                      { id: "version", header: "Version", cell: (item: any) => item.version },
                      { id: "created", header: "Created", cell: (item: any) => item.created },
                      {
                        id: "actions",
                        header: "",
                        cell: (item: any) => (
                          <DeleteButton
                            itemName={item.name}
                            resourceType="cluster"
                            loading={deleteCluster.isPending && deleteCluster.variables === item.name}
                            onDelete={() => deleteCluster.mutateAsync(item.name)}
                          />
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find clusters by name"
                    filterFunction={(item: any, searchText: string) =>
                      item.name.toLowerCase().includes(searchText.toLowerCase())
                    }
                  />
                  <Modal
                    visible={showCreateCluster}
                    onDismiss={() => setShowCreateCluster(false)}
                    header="Create EKS cluster"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateCluster(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => {
                              createCluster.mutate(
                                {
                                  name: clusterName,
                                  roleArn: clusterRoleArn,
                                  version: clusterVersion || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setShowCreateCluster(false);
                                    setClusterName("");
                                    setClusterRoleArn("");
                                    setClusterVersion("");
                                  },
                                }
                              );
                            }}
                            disabled={!clusterName || !clusterRoleArn}
                            loading={createCluster.isPending}
                          >
                            Create
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <FormField label="Cluster name">
                        <Input
                          value={clusterName}
                          onChange={({ detail }) => setClusterName(detail.value)}
                          placeholder="my-cluster"
                        />
                      </FormField>
                      <FormField label="Role ARN">
                        <Input
                          value={clusterRoleArn}
                          onChange={({ detail }) => setClusterRoleArn(detail.value)}
                          placeholder="arn:aws:iam::123456789012:role/eks-role"
                        />
                      </FormField>
                      <FormField label="Kubernetes version (optional)">
                        <Input
                          value={clusterVersion}
                          onChange={({ detail }) => setClusterVersion(detail.value)}
                          placeholder="1.27"
                        />
                      </FormField>
                    </Form>
                  </Modal>
                </>
              )}
              {selectedCluster && (
                <NodegroupsPanel
                  clusterName={selectedCluster}
                  nodegroupsData={nodegroupsData}
                  nodegroupsLoading={nodegroupsLoading}
                  createNodegroup={createNodegroup}
                  deleteNodegroup={deleteNodegroup}
                  showCreateNodegroup={showCreateNodegroup}
                  setShowCreateNodegroup={setShowCreateNodegroup}
                  ngName={ngName}
                  setNgName={setNgName}
                  ngNodeRole={ngNodeRole}
                  setNgNodeRole={setNgNodeRole}
                  ngSubnets={ngSubnets}
                  setNgSubnets={setNgSubnets}
                />
              )}
            </>
          ),
        },
      ]}
    />
  );
}

function NodegroupsPanel({
  clusterName,
  nodegroupsData,
  nodegroupsLoading,
  createNodegroup,
  deleteNodegroup,
  showCreateNodegroup,
  setShowCreateNodegroup,
  ngName,
  setNgName,
  ngNodeRole,
  setNgNodeRole,
  ngSubnets,
  setNgSubnets,
}: {
  clusterName: string;
  nodegroupsData: any;
  nodegroupsLoading: boolean;
  createNodegroup: any;
  deleteNodegroup: any;
  showCreateNodegroup: boolean;
  setShowCreateNodegroup: (v: boolean) => void;
  ngName: string;
  setNgName: (v: string) => void;
  ngNodeRole: string;
  setNgNodeRole: (v: string) => void;
  ngSubnets: string;
  setNgSubnets: (v: string) => void;
}) {
  return (
    <>
      <ResourceTable
        resourceName="Node Group"
        headerTitle={`Node Groups — ${clusterName}`}
        headerCounter={nodegroupsData?.total}
        items={(nodegroupsData?.nodegroups || []).map((ng: any) => ({
          name: ng.nodegroupName,
          status: ng.status,
          version: ng.version || "-",
          instanceTypes: (ng.instanceTypes || []).join(", ") || "-",
          desired: ng.scalingConfig?.desiredSize ?? "-",
          created: ng.createdAt ? new Date(ng.createdAt).toLocaleDateString() : "-",
        }))}
        loading={nodegroupsLoading}
        onCreate={() => setShowCreateNodegroup(true)}
        emptyMessage="No node groups"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => item.name,
            isRowHeader: true,
          },
          { id: "status", header: "Status", cell: (item: any) => item.status },
          { id: "version", header: "Version", cell: (item: any) => item.version },
          { id: "instanceTypes", header: "Instance Types", cell: (item: any) => item.instanceTypes },
          { id: "desired", header: "Desired", cell: (item: any) => item.desired },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="node group"
                loading={deleteNodegroup.isPending && deleteNodegroup.variables === item.name}
                onDelete={() => deleteNodegroup.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find node groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      <Modal
        visible={showCreateNodegroup}
        onDismiss={() => setShowCreateNodegroup(false)}
        header="Create node group"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateNodegroup(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  createNodegroup.mutate(
                    {
                      nodegroupName: ngName,
                      nodeRole: ngNodeRole,
                      subnets: ngSubnets.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                    {
                      onSuccess: () => {
                        setShowCreateNodegroup(false);
                        setNgName("");
                        setNgNodeRole("");
                        setNgSubnets("");
                      },
                    }
                  );
                }}
                disabled={!ngName || !ngNodeRole || !ngSubnets}
                loading={createNodegroup.isPending}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Node group name">
            <Input
              value={ngName}
              onChange={({ detail }) => setNgName(detail.value)}
              placeholder="my-nodegroup"
            />
          </FormField>
          <FormField label="Node role ARN">
            <Input
              value={ngNodeRole}
              onChange={({ detail }) => setNgNodeRole(detail.value)}
              placeholder="arn:aws:iam::123456789012:role/eks-node-role"
            />
          </FormField>
          <FormField label="Subnets (comma-separated)">
            <Input
              value={ngSubnets}
              onChange={({ detail }) => setNgSubnets(detail.value)}
              placeholder="subnet-12345678, subnet-87654321"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  Auto Scaling
// ────────────────────────────────────────────────────────

function AutoScalingDashboard() {
  const { data, isLoading } = useAutoScalingGroups();
  const createGroup = useCreateAutoScalingGroup();
  const deleteGroup = useDeleteAutoScalingGroup();
  const { data: lcData } = useLaunchConfigurations();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [minSize, setMinSize] = useState("1");
  const [maxSize, setMaxSize] = useState("5");
  const [desired, setDesired] = useState("2");
  const [lcName, setLcName] = useState("");

  if (isLoading) return <Spinner />;

  return (
    <Tabs
      tabs={[
        {
          id: "groups",
          label: "Auto Scaling Groups",
          content: (
            <ResourceTable
              resourceName="Auto Scaling Group"
              headerTitle="Auto Scaling Groups"
              headerCounter={data?.total}
              items={(data?.groups || []).map((g: any) => ({
                name: g.AutoScalingGroupName,
                min: g.MinSize,
                max: g.MaxSize,
                desired: g.DesiredCapacity,
                instances: g.Instances?.length || 0,
                health: g.HealthCheckType,
                created: g.CreatedTime ? new Date(g.CreatedTime).toLocaleDateString() : "-",
              }))}
              loading={isLoading}
              onCreate={() => setShowCreate(true)}
              emptyMessage="No auto scaling groups"
              columns={[
                { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "min", header: "Min", cell: (i: any) => i.min },
                { id: "max", header: "Max", cell: (i: any) => i.max },
                { id: "desired", header: "Desired", cell: (i: any) => i.desired },
                { id: "instances", header: "Instances", cell: (i: any) => i.instances },
                { id: "health", header: "Health Check", cell: (i: any) => i.health },
                { id: "created", header: "Created", cell: (i: any) => i.created },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <DeleteButton
                      itemName={i.name}
                      resourceType="auto scaling group"
                      loading={deleteGroup.isPending && deleteGroup.variables === i.name}
                      onDelete={() => deleteGroup.mutateAsync(i.name)}
                    />
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find groups by name"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "launch-configs",
          label: "Launch Configurations",
          content: (
            <ResourceTable
              resourceName="Launch Configuration"
              headerTitle="Launch Configurations"
              headerCounter={lcData?.total}
              items={(lcData?.launchConfigurations || []).map((lc: any) => ({
                name: lc.LaunchConfigurationName,
                image: lc.ImageId,
                type: lc.InstanceType,
                created: lc.CreatedTime ? new Date(lc.CreatedTime).toLocaleDateString() : "-",
              }))}
              loading={false}
              emptyMessage="No launch configurations"
              columns={[
                { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "image", header: "AMI", cell: (i: any) => i.image },
                { id: "type", header: "Instance Type", cell: (i: any) => i.type },
                { id: "created", header: "Created", cell: (i: any) => i.created },
              ]}
              filterEnabled
              filterPlaceholder="Find launch configs"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  CloudFront
// ────────────────────────────────────────────────────────

function CloudFrontDashboard() {
  const { data, isLoading } = useCloudFrontDistributions();
  const { data: cachePolicies } = useCloudFrontCachePolicies();
  const { data: functions } = useCloudFrontFunctions();
  const [selectedDist, setSelectedDist] = useState<string | null>(null);
  const { data: invData } = useCloudFrontInvalidations(selectedDist);
  const createInvalidation = useCreateCloudFrontInvalidation(selectedDist || "");
  const [showInvalidation, setShowInvalidation] = useState(false);
  const [invPaths, setInvPaths] = useState("/*");

  if (isLoading) return <Spinner />;

  return (
    <Tabs
      activeTabId={selectedDist ? "invalidations" : "distributions"}
      tabs={[
        {
          id: "distributions",
          label: "Distributions",
          content: (
            <ResourceTable
              resourceName="Distribution"
              headerTitle="CloudFront Distributions"
              headerCounter={data?.total}
              items={(data?.distributions || []).map((d: any) => ({
                id: d.Id,
                domain: d.DomainName,
                status: d.Status,
                enabled: d.Enabled,
                priceClass: d.PriceClass || "PriceClass_All",
                modified: d.LastModifiedTime ? new Date(d.LastModifiedTime).toLocaleDateString() : "-",
              }))}
              loading={isLoading}
              emptyMessage="No CloudFront distributions"
              columns={[
                {
                  id: "id",
                  header: "ID",
                  cell: (i: any) => (
                    <Button variant="link" onClick={() => setSelectedDist(i.id)}>
                      {i.id}
                    </Button>
                  ),
                  isRowHeader: true,
                },
                { id: "domain", header: "Domain", cell: (i: any) => i.domain },
                { id: "status", header: "Status", cell: (i: any) => i.status },
                { id: "enabled", header: "Enabled", cell: (i: any) => (i.enabled ? "Yes" : "No") },
                { id: "modified", header: "Last Modified", cell: (i: any) => i.modified },
              ]}
              filterEnabled
              filterPlaceholder="Find distributions by ID"
              filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "invalidations",
          label: "Invalidations",
          content: (
            <>
              {selectedDist && (
                <Box margin={{ bottom: "s" }}>
                  <Button iconName="arrow-left" onClick={() => setSelectedDist(null)}>
                    Back to distributions
                  </Button>
                </Box>
              )}
              {!selectedDist ? (
                <Alert type="info">Select a distribution to view its invalidations.</Alert>
              ) : (
                <>
                  <ResourceTable
                    resourceName="Invalidation"
                    headerTitle={`Invalidations for ${selectedDist}`}
                    headerCounter={invData?.total}
                    items={(invData?.invalidations || []).map((inv: any) => ({
                      id: inv.Id,
                      status: inv.Status,
                      paths: inv.InvalidationBatch?.Paths?.Items?.join(", ") || "-",
                      created: inv.CreateTime ? new Date(inv.CreateTime).toLocaleDateString() : "-",
                    }))}
                    loading={false}
                    onCreate={() => setShowInvalidation(true)}
                    emptyMessage="No invalidations"
                    columns={[
                      { id: "id", header: "ID", cell: (i: any) => i.id, isRowHeader: true },
                      { id: "status", header: "Status", cell: (i: any) => i.status },
                      { id: "paths", header: "Paths", cell: (i: any) => i.paths },
                      { id: "created", header: "Created", cell: (i: any) => i.created },
                    ]}
                  />
                  <Modal
                    visible={showInvalidation}
                    onDismiss={() => setShowInvalidation(false)}
                    header="Create invalidation"
                    footer={
                      <Box>
                        <Button
                          variant="primary"
                          loading={createInvalidation.isPending}
                          onClick={() => {
                            const paths = invPaths.split("\n").map((p) => p.trim()).filter(Boolean);
                            createInvalidation.mutateAsync({ paths }).then(() => {
                              setShowInvalidation(false);
                              setInvPaths("/*");
                            });
                          }}
                        >
                          Create
                        </Button>
                        <Button onClick={() => setShowInvalidation(false)}>Cancel</Button>
                      </Box>
                    }
                  >
                    <FormField label="Paths (one per line)" description="Use /* for all files, /images/* for a directory">
                      <Textarea value={invPaths} onChange={({ detail }) => setInvPaths(detail.value)} rows={5} />
                    </FormField>
                  </Modal>
                </>
              )}
            </>
          ),
        },
        {
          id: "cache-policies",
          label: "Cache Policies",
          content: (
            <ResourceTable
              resourceName="Cache Policy"
              headerTitle="Cache Policies"
              headerCounter={cachePolicies?.total}
              items={(cachePolicies?.cachePolicies || []).map((p: any) => ({
                id: p.CachePolicy?.Id,
                name: p.CachePolicy?.CachePolicyConfig?.Name,
                type: p.Type,
                comment: p.CachePolicy?.CachePolicyConfig?.Comment || "-",
              }))}
              loading={false}
              emptyMessage="No cache policies"
              columns={[
                { id: "id", header: "ID", cell: (i: any) => i.id, isRowHeader: true },
                { id: "name", header: "Name", cell: (i: any) => i.name },
                { id: "type", header: "Type", cell: (i: any) => i.type },
                { id: "comment", header: "Comment", cell: (i: any) => i.comment },
              ]}
              filterEnabled
              filterPlaceholder="Find policies"
              filterFunction={(i: any, s: string) =>
                (i.name || "").toLowerCase().includes(s.toLowerCase())
              }
            />
          ),
        },
        {
          id: "functions",
          label: "Functions",
          content: (
            <ResourceTable
              resourceName="Function"
              headerTitle="CloudFront Functions"
              headerCounter={functions?.total}
              items={(functions?.functions || []).map((f: any) => ({
                name: f.Name,
                arn: f.FunctionARN,
                stage: f.FunctionMetadata?.Stage || f.Stage || "-",
                runtime: f.FunctionConfig?.Runtime || "-",
                created: f.FunctionMetadata?.CreatedTime
                  ? new Date(f.FunctionMetadata.CreatedTime).toLocaleDateString()
                  : "-",
              }))}
              loading={false}
              emptyMessage="No CloudFront functions"
              columns={[
                { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "stage", header: "Stage", cell: (i: any) => i.stage },
                { id: "runtime", header: "Runtime", cell: (i: any) => i.runtime },
                { id: "created", header: "Created", cell: (i: any) => i.created },
              ]}
              filterEnabled
              filterPlaceholder="Find functions"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  Kinesis
// ────────────────────────────────────────────────────────

function KinesisDashboard() {
  const { data, isLoading } = useKinesisStreams();
  const createStream = useCreateKinesisStream();
  const deleteStream = useDeleteKinesisStream();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [shardCount, setShardCount] = useState("1");
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const { data: shardsData } = useKinesisShards(selectedStream);
  const putRecord = usePutKinesisRecord(selectedStream || "");
  const [showPutRecord, setShowPutRecord] = useState(false);
  const [recordData, setRecordData] = useState("");
  const [recordKey, setRecordKey] = useState("");

  if (isLoading) return <Spinner />;

  return (
    <Tabs
      activeTabId={selectedStream ? "detail" : "streams"}
      onChange={({ detail }) => {
        if (detail.activeTabId === "streams") setSelectedStream(null);
      }}
      tabs={[
        {
          id: "streams",
          label: "Streams",
          content: (
            <>
              {selectedStream && (
                <Box margin={{ bottom: "s" }}>
                  <Button iconName="arrow-left" onClick={() => setSelectedStream(null)}>
                    Back to streams
                  </Button>
                </Box>
              )}
              <ResourceTable
                resourceName="Stream"
                headerTitle="Kinesis Streams"
                headerCounter={data?.total}
                items={(data?.streams || []).map((s: any) => ({
                  name: s.StreamName,
                  status: s.StreamStatus,
                  shards: s.OpenShardCount || 0,
                  retention: s.RetentionPeriodHours,
                  encryption: s.EncryptionType || "NONE",
                  created: s.StreamCreationTimestamp
                    ? new Date(s.StreamCreationTimestamp).toLocaleDateString()
                    : "-",
                }))}
                loading={isLoading}
                onCreate={() => setShowCreate(true)}
                emptyMessage="No Kinesis streams"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (i: any) => (
                      <Button variant="link" onClick={() => setSelectedStream(i.name)}>
                        {i.name}
                      </Button>
                    ),
                    isRowHeader: true,
                  },
                  { id: "status", header: "Status", cell: (i: any) => i.status },
                  { id: "shards", header: "Open Shards", cell: (i: any) => i.shards },
                  { id: "retention", header: "Retention (hrs)", cell: (i: any) => i.retention },
                  { id: "encryption", header: "Encryption", cell: (i: any) => i.encryption },
                  { id: "created", header: "Created", cell: (i: any) => i.created },
                  {
                    id: "actions",
                    header: "",
                    cell: (i: any) => (
                      <DeleteButton
                        itemName={i.name}
                        resourceType="stream"
                        loading={deleteStream.isPending && deleteStream.variables === i.name}
                        onDelete={() => deleteStream.mutateAsync(i.name)}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find streams by name"
                filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
              />
              <Modal
                visible={showCreate}
                onDismiss={() => setShowCreate(false)}
                header="Create Kinesis stream"
                footer={
                  <Box>
                    <Button
                      variant="primary"
                      loading={createStream.isPending}
                      onClick={() => {
                        createStream
                          .mutateAsync({
                            streamName: name,
                            shardCount: parseInt(shardCount) || 1,
                          })
                          .then(() => {
                            setShowCreate(false);
                            setName("");
                            setShardCount("1");
                          });
                      }}
                    >
                      Create
                    </Button>
                    <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Stream name">
                    <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-stream" />
                  </FormField>
                  <FormField label="Shard count">
                    <Input
                      value={shardCount}
                      onChange={({ detail }) => setShardCount(detail.value)}
                      placeholder="1"
                      type="number"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ),
        },
        {
          id: "detail",
          label: selectedStream ? `Shards: ${selectedStream}` : "Stream Details",
          content: selectedStream ? (
            <>
              <Box margin={{ bottom: "s" }}>
                <Button onClick={() => setShowPutRecord(true)}>Put record</Button>
              </Box>
              <ResourceTable
                resourceName="Shard"
                headerTitle={`Shards in ${selectedStream}`}
                headerCounter={shardsData?.total}
                items={(shardsData?.shards || []).map((sh: any) => ({
                  id: sh.ShardId,
                  parent: sh.ParentShardId || "-",
                  startHash: sh.HashKeyRange?.StartingHashKey,
                  endHash: sh.HashKeyRange?.EndingHashKey,
                  startSeq: sh.SequenceNumberRange?.StartingSequenceNumber?.slice(0, 20) + "...",
                }))}
                loading={false}
                emptyMessage="No shards"
                columns={[
                  { id: "id", header: "Shard ID", cell: (i: any) => i.id, isRowHeader: true },
                  { id: "parent", header: "Parent", cell: (i: any) => i.parent },
                  { id: "startSeq", header: "Start Sequence", cell: (i: any) => i.startSeq },
                ]}
              />
              <Modal
                visible={showPutRecord}
                onDismiss={() => setShowPutRecord(false)}
                header={`Put record to ${selectedStream}`}
                footer={
                  <Box>
                    <Button
                      variant="primary"
                      loading={putRecord.isPending}
                      onClick={() => {
                        putRecord
                          .mutateAsync({ data: recordData, partitionKey: recordKey })
                          .then(() => {
                            setShowPutRecord(false);
                            setRecordData("");
                            setRecordKey("");
                          });
                      }}
                    >
                      Put record
                    </Button>
                    <Button onClick={() => setShowPutRecord(false)}>Cancel</Button>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Data">
                    <Input
                      value={recordData}
                      onChange={({ detail }) => setRecordData(detail.value)}
                      placeholder="Hello, Kinesis!"
                    />
                  </FormField>
                  <FormField label="Partition key">
                    <Input
                      value={recordKey}
                      onChange={({ detail }) => setRecordKey(detail.value)}
                      placeholder="partition-key"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ) : (
            <Alert type="info">Select a stream to view its shards.</Alert>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  Neptune
// ────────────────────────────────────────────────────────

function NeptuneDashboard() {
  const { data: clustersData, isLoading: clustersLoading } = useNeptuneClusters();
  const deleteCluster = useDeleteNeptuneCluster();
  const { data: instancesData, isLoading: instancesLoading } = useNeptuneInstances();
  const deleteInstance = useDeleteNeptuneInstance();

  return (
    <Tabs
      tabs={[
        {
          id: "clusters",
          label: "Clusters",
          content: (
            <ResourceTable
              resourceName="Cluster"
              headerTitle="Neptune Clusters"
              headerCounter={clustersData?.total}
              items={(clustersData?.clusters || []).map((c: any) => ({
                id: c.DBClusterIdentifier,
                status: c.Status,
                engine: c.Engine,
                version: c.EngineVersion || "-",
                endpoint: c.Endpoint || "-",
                members: c.DBClusterMembers?.length || 0,
              }))}
              loading={clustersLoading}
              emptyMessage="No Neptune clusters"
              columns={[
                { id: "id", header: "Cluster ID", cell: (i: any) => i.id, isRowHeader: true },
                { id: "status", header: "Status", cell: (i: any) => i.status },
                { id: "engine", header: "Engine", cell: (i: any) => i.engine },
                { id: "version", header: "Version", cell: (i: any) => i.version },
                { id: "endpoint", header: "Endpoint", cell: (i: any) => i.endpoint },
                { id: "members", header: "Members", cell: (i: any) => i.members },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <DeleteButton
                      itemName={i.id}
                      resourceType="cluster"
                      loading={deleteCluster.isPending && deleteCluster.variables === i.id}
                      onDelete={() => deleteCluster.mutateAsync(i.id)}
                    />
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find clusters"
              filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "instances",
          label: "Instances",
          content: (
            <ResourceTable
              resourceName="Instance"
              headerTitle="Neptune Instances"
              headerCounter={instancesData?.total}
              items={(instancesData?.instances || []).map((i: any) => ({
                id: i.DBInstanceIdentifier,
                cluster: i.DBClusterIdentifier || "-",
                cls: i.DBInstanceClass || "-",
                status: i.DBInstanceStatus || "-",
                endpoint: i.Endpoint?.Address || "-",
              }))}
              loading={instancesLoading}
              emptyMessage="No Neptune instances"
              columns={[
                { id: "id", header: "Instance ID", cell: (i: any) => i.id, isRowHeader: true },
                { id: "cluster", header: "Cluster", cell: (i: any) => i.cluster },
                { id: "cls", header: "Class", cell: (i: any) => i.cls },
                { id: "status", header: "Status", cell: (i: any) => i.status },
                { id: "endpoint", header: "Endpoint", cell: (i: any) => i.endpoint },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <DeleteButton
                      itemName={i.id}
                      resourceType="instance"
                      loading={deleteInstance.isPending && deleteInstance.variables === i.id}
                      onDelete={() => deleteInstance.mutateAsync(i.id)}
                    />
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find instances"
              filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  EventBridge Pipes
// ────────────────────────────────────────────────────────

function PipesDashboard() {
  const { data, isLoading } = usePipes();
  const deletePipe = useDeletePipe();
  const startPipe = useStartPipe();
  const stopPipe = useStopPipe();

  if (isLoading) return <Spinner />;

  return (
    <ResourceTable
      resourceName="Pipe"
      headerTitle="EventBridge Pipes"
      headerCounter={data?.total}
      items={(data?.pipes || []).map((p: any) => ({
        name: p.Name,
        source: p.Source,
        target: p.Target,
        desired: p.DesiredState,
        current: p.CurrentState,
        created: p.CreationTime ? new Date(p.CreationTime * 1000).toLocaleDateString() : "-",
      }))}
      loading={isLoading}
      emptyMessage="No EventBridge pipes"
      columns={[
        { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
        { id: "source", header: "Source", cell: (i: any) => i.source },
        { id: "target", header: "Target", cell: (i: any) => i.target },
        { id: "desired", header: "Desired", cell: (i: any) => i.desired },
        { id: "current", header: "Current", cell: (i: any) => i.current },
        { id: "created", header: "Created", cell: (i: any) => i.created },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              {i.desired !== "RUNNING" && (
                <Button
                  loading={startPipe.isPending && startPipe.variables === i.name}
                  onClick={() => startPipe.mutateAsync(i.name)}
                >
                  Start
                </Button>
              )}
              {i.desired === "RUNNING" && (
                <Button
                  loading={stopPipe.isPending && stopPipe.variables === i.name}
                  onClick={() => stopPipe.mutateAsync(i.name)}
                >
                  Stop
                </Button>
              )}
              <DeleteButton
                itemName={i.name}
                resourceType="pipe"
                loading={deletePipe.isPending && deletePipe.variables === i.name}
                onDelete={() => deletePipe.mutateAsync(i.name)}
              />
            </SpaceBetween>
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find pipes by name"
      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
    />
  );
}

// ────────────────────────────────────────────────────────
//  Cognito
// ────────────────────────────────────────────────────────

function CognitoDashboard() {
  const { data, isLoading } = useCognitoUserPools();
  const deletePool = useDeleteCognitoUserPool();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const { data: usersData } = useCognitoUsers(selectedPool);
  const { data: groupsData } = useCognitoGroups(selectedPool);
  const { data: clientsData } = useCognitoUserPoolClients(selectedPool);

  if (isLoading) return <Spinner />;

  if (selectedPool) {
    return (
      <>
        <Box margin={{ bottom: "s" }}>
          <Button iconName="arrow-left" onClick={() => setSelectedPool(null)}>
            Back to user pools
          </Button>
        </Box>
        <Tabs
          tabs={[
            {
              id: "users",
              label: "Users",
              content: (
                <ResourceTable
                  resourceName="User"
                  headerTitle={`Users in ${selectedPool}`}
                  headerCounter={usersData?.total}
                  items={(usersData?.users || []).map((u: any) => ({
                    username: u.Username,
                    status: u.UserStatus,
                    enabled: u.Enabled,
                    created: u.UserCreateDate
                      ? new Date(u.UserCreateDate * 1000).toLocaleDateString()
                      : "-",
                  }))}
                  loading={false}
                  emptyMessage="No users"
                  columns={[
                    { id: "username", header: "Username", cell: (i: any) => i.username, isRowHeader: true },
                    { id: "status", header: "Status", cell: (i: any) => i.status },
                    { id: "enabled", header: "Enabled", cell: (i: any) => (i.enabled ? "Yes" : "No") },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                  ]}
                  filterEnabled
                  filterPlaceholder="Find users"
                  filterFunction={(i: any, s: string) => i.username.toLowerCase().includes(s.toLowerCase())}
                />
              ),
            },
            {
              id: "groups",
              label: "Groups",
              content: (
                <ResourceTable
                  resourceName="Group"
                  headerTitle={`Groups in ${selectedPool}`}
                  headerCounter={groupsData?.total}
                  items={(groupsData?.groups || []).map((g: any) => ({
                    name: g.GroupName,
                    description: g.Description || "-",
                    precedence: g.Precedence ?? "-",
                    role: g.RoleArn || "-",
                  }))}
                  loading={false}
                  emptyMessage="No groups"
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                    { id: "description", header: "Description", cell: (i: any) => i.description },
                    { id: "precedence", header: "Precedence", cell: (i: any) => i.precedence },
                    { id: "role", header: "Role ARN", cell: (i: any) => i.role },
                  ]}
                  filterEnabled
                  filterPlaceholder="Find groups"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                />
              ),
            },
            {
              id: "clients",
              label: "App Clients",
              content: (
                <ResourceTable
                  resourceName="Client"
                  headerTitle={`App Clients in ${selectedPool}`}
                  headerCounter={clientsData?.total}
                  items={(clientsData?.clients || []).map((cl: any) => ({
                    id: cl.ClientId,
                    name: cl.ClientName,
                    created: cl.CreationDate
                      ? new Date(cl.CreationDate * 1000).toLocaleDateString()
                      : "-",
                  }))}
                  loading={false}
                  emptyMessage="No app clients"
                  columns={[
                    { id: "id", header: "Client ID", cell: (i: any) => i.id, isRowHeader: true },
                    { id: "name", header: "Name", cell: (i: any) => i.name },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                  ]}
                  filterEnabled
                  filterPlaceholder="Find clients"
                  filterFunction={(i: any, s: string) =>
                    (i.name || "").toLowerCase().includes(s.toLowerCase())
                  }
                />
              ),
            },
          ]}
        />
      </>
    );
  }

  return (
    <ResourceTable
      resourceName="User Pool"
      headerTitle="Cognito User Pools"
      headerCounter={data?.total}
      items={(data?.userPools || []).map((p: any) => ({
        id: p.Id,
        name: p.Name,
        status: p.Status,
        created: p.CreationDate ? new Date(p.CreationDate * 1000).toLocaleDateString() : "-",
      }))}
      loading={isLoading}
      emptyMessage="No Cognito user pools"
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (i: any) => (
            <Button variant="link" onClick={() => setSelectedPool(i.id)}>
              {i.name}
            </Button>
          ),
          isRowHeader: true,
        },
        { id: "id", header: "Pool ID", cell: (i: any) => i.id },
        { id: "status", header: "Status", cell: (i: any) => i.status },
        { id: "created", header: "Created", cell: (i: any) => i.created },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <DeleteButton
              itemName={i.name}
              resourceType="user pool"
              loading={deletePool.isPending && deletePool.variables === i.id}
              onDelete={() => deletePool.mutateAsync(i.id)}
            />
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find user pools"
      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
    />
  );
}
