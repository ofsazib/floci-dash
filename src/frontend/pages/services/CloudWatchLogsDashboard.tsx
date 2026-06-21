// Auto-split from ServicePage.tsx. Shared import preamble is intentional;
// unused imports are tree-shaken at build (noUnusedLocals is off).
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
import { useHealth } from "../../hooks/useSystem";
import { getServiceLabel } from "../../types/services";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import {
  useDynamoDBTables,
  useDynamoDBCreateTable,
  useDynamoDBDeleteTable,
} from "../../hooks/useDynamoDB";
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
} from "../../hooks/useLogs";
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
} from "../../hooks/useRDS";
import { api } from "../../lib/client";
import { formatBytes } from "../../lib/utils";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import DynamoDBTableDetail from "../../components/DynamoDBTableDetail";
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
} from "../../hooks/useECS";
import {
  useSSMParameters,
  useSSMParameter,
  usePutSSMParameter,
  useDeleteSSMParameter,
  useSSMParameterHistory,
} from "../../hooks/useSSM";
import {
  useRoute53HostedZones,
  useCreateRoute53HostedZone,
  useDeleteRoute53HostedZone,
  useRoute53RecordSets,
  useCreateRoute53RecordSet,
  useDeleteRoute53RecordSet,
} from "../../hooks/useRoute53";
import {
  useAPIGatewayApis,
  useAPIGatewayApi,
  useCreateAPIGatewayApi,
  useDeleteAPIGatewayApi,
  useAPIGatewayResources,
  useAPIGatewayDeployments,
} from "../../hooks/useAPIGateway";
import { useToast } from "../../components/Toast";
import {
  useReportDefinitions,
  useCreateReportDefinition,
  useModifyReportDefinition,
  useDeleteReportDefinition,
} from "../../hooks/useCUR";
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
} from "../../hooks/useAppSync";
import {
  useSchedulerGroups,
  useCreateSchedulerGroup,
  useDeleteSchedulerGroup,
  useSchedules,
  useCreateSchedule,
  useDeleteSchedule,
} from "../../hooks/useScheduler";
import {
  useECRRepositories,
  useECRCreateRepository,
  useECRDeleteRepository,
  useECRImages,
  useECRRepositoryPolicy,
  useECRLifecyclePolicy,
} from "../../hooks/useECR";
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
} from "../../hooks/useELB";
import {
  useSESIdentities,
  useSESVerifyEmail,
  useSESVerifyDomain,
  useSESDeleteIdentity,
  useSESSendEmail,
  useSESVerifiedEmails,
} from "../../hooks/useSES";
import {
  useSTSCallerIdentity,
  useSTSAssumeRole,
  useSTSGetSessionToken,
} from "../../hooks/useSTS";
import {
  useEKSClusters,
  useEKSCreateCluster,
  useEKSDeleteCluster,
  useEKSNodegroups,
  useEKSCreateNodegroup,
  useEKSDeleteNodegroup,
} from "../../hooks/useEKS";
import {
  useAutoScalingGroups,
  useCreateAutoScalingGroup,
  useDeleteAutoScalingGroup,
  useLaunchConfigurations,
} from "../../hooks/useAutoScaling";
import {
  useCloudFrontDistributions,
  useCloudFrontInvalidations,
  useCreateCloudFrontInvalidation,
  useCloudFrontCachePolicies,
  useCloudFrontFunctions,
} from "../../hooks/useCloudFront";
import {
  useKinesisStreams,
  useCreateKinesisStream,
  useDeleteKinesisStream,
  useKinesisShards,
  usePutKinesisRecord,
} from "../../hooks/useKinesis";
import {
  useNeptuneClusters,
  useCreateNeptuneCluster,
  useDeleteNeptuneCluster,
  useNeptuneInstances,
  useCreateNeptuneInstance,
  useDeleteNeptuneInstance,
} from "../../hooks/useNeptune";
import {
  usePipes,
  useCreatePipe,
  useDeletePipe,
  useStartPipe,
  useStopPipe,
} from "../../hooks/usePipes";
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
} from "../../hooks/useCognito";
import {
  useApiGatewayV2Apis,
  useCreateApiGatewayV2Api,
  useDeleteApiGatewayV2Api,
  useApiGatewayV2Routes,
  useApiGatewayV2Integrations,
  useApiGatewayV2Stages,
  useApiGatewayV2Deployments,
  useCreateApiGatewayV2Deployment,
} from "../../hooks/useApiGatewayV2";
import {
  useACMCertificates,
  useRequestACMCertificate,
  useDeleteACMCertificate,
} from "../../hooks/useACM";
import {
  useCloudTrailTrails,
  useCreateCloudTrailTrail,
  useDeleteCloudTrailTrail,
  useStartCloudTrailLogging,
  useStopCloudTrailLogging,
} from "../../hooks/useCloudTrail";
import {
  useConfigRules,
  usePutConfigRule,
  useDeleteConfigRule,
  useConfigRecorders,
  useConformancePacks,
  useDeleteConformancePack,
} from "../../hooks/useConfigService";
import {
  useAppConfigApplications,
  useDeleteAppConfigApplication,
  useAppConfigEnvironments,
  useAppConfigProfiles,
} from "../../hooks/useAppConfig";
import {
  useCloudMapNamespaces,
  useCreateCloudMapNamespace,
  useDeleteCloudMapNamespace,
  useCloudMapServices,
  useDeleteCloudMapService,
  useCloudMapInstances,
} from "../../hooks/useCloudMap";
import {
  useAthenaWorkGroups,
  useCreateAthenaWorkGroup,
  useDeleteAthenaWorkGroup,
  useAthenaQueryExecutions,
} from "../../hooks/useAthena";
import {
  useGlueDatabases,
  useCreateGlueDatabase,
  useDeleteGlueDatabase,
  useGlueTables,
  useDeleteGlueTable,
} from "../../hooks/useGlue";
import {
  useFirehoseStreams,
  useCreateFirehoseStream,
  useDeleteFirehoseStream,
} from "../../hooks/useFirehose";
import {
  useStateMachines,
  useDeleteStateMachine,
  useStateMachineExecutions,
  useActivities,
} from "../../hooks/useStepFunctions";
import {
  useOpenSearchDomains,
  useDeleteOpenSearchDomain,
} from "../../hooks/useOpenSearch";
import {
  useMskClusters,
  useDeleteMskCluster,
} from "../../hooks/useMsk";
import {
  useTranscriptionJobs,
  useDeleteTranscriptionJob,
} from "../../hooks/useTranscribe";
import {
  useCostAndUsage,
  useDimensionValues,
  useCETags,
  useReservationCoverage,
  useReservationUtilization,
  useSavingsPlansCoverage,
  useSavingsPlansUtilization,
  useCostCategories,
} from "../../hooks/useCE";
import {
  usePricingServices,
  usePricingAttributeValues,
  usePricingProducts,
  usePricingPriceLists,
  usePricingPriceListFileUrl,
} from "../../hooks/usePricing";
import {
  useRGTResources,
  useRGTTagKeys,
  useRGTTagValues,
  useRGTTagResources,
  useRGTUntagResources,
} from "../../hooks/useRGT";
import {
  useCodeBuildProjects,
  useCreateCodeBuildProject,
  useCodeBuildProject,
  useDeleteCodeBuildProject,
  useStartCodeBuildBuild,
  useCodeBuildProjectBuilds,
  useCodeBuildBuilds,
  useCodeBuildBuild,
  useStopCodeBuildBuild,
  useCodeBuildSourceCredentials,
  useImportCodeBuildSourceCredentials,
  useDeleteCodeBuildSourceCredentials,
  useCodeBuildCuratedImages,
} from "../../hooks/useCodeBuild";
import {
  useCodeDeployApplications,
  useCreateCodeDeployApplication,
  useDeleteCodeDeployApplication,
  useCodeDeployDeploymentGroups,
  useCreateCodeDeployDeploymentGroup,
  useCodeDeployDeploymentConfigs,
  useCreateCodeDeployDeploymentConfig,
  useCodeDeployDeployments,
  useCreateCodeDeployDeployment,
} from "../../hooks/useCodeDeploy";
import {
  useBackupPlans,
  useCreateBackupPlan,
  useBackupPlan,
  useDeleteBackupPlan,
  useBackupVaults,
  useCreateBackupVault,
  useBackupVault,
  useDeleteBackupVault,
  useBackupSelections,
  useCreateBackupSelection,
  useDeleteBackupSelection,
  useBackupJobs,
  useStartBackupJob,
  useBackupJob,
  useStopBackupJob,
  useBackupTags,
} from "../../hooks/useBackup";
import {
  useTransferServers,
  useCreateTransferServer,
  useTransferServer,
  useDeleteTransferServer,
  useStartTransferServer,
  useStopTransferServer,
  useTransferUsers,
  useCreateTransferUser,
  useTransferUser,
  useDeleteTransferUser,
  useTransferTags,
} from "../../hooks/useTransfer";
import {
  useBCMExports,
  useCreateBCMExport,
  useDeleteBCMExport,
  useBCMExportExecutions,
  useBCMTables,
} from "../../hooks/useBCMDataExports";
import {
  useWebACLs,
  useCreateWebACL,
  useDeleteWebACL,
  useIPSets,
  useCreateIPSet,
  useDeleteIPSet,
  useRegexPatternSets,
  useCreateRegexPatternSet,
  useDeleteRegexPatternSet,
  useRuleGroups,
  useCreateRuleGroup,
  useDeleteRuleGroup,
} from "../../hooks/useWafV2";
import {
  useElastiCacheReplicationGroups,
  useElastiCacheCreateReplicationGroup,
  useElastiCacheDeleteReplicationGroup,
  useElastiCacheCacheClusters,
  useElastiCacheCreateCacheCluster,
  useElastiCacheDeleteCacheCluster,
  useElastiCacheUsers,
  useElastiCacheCreateUser,
  useElastiCacheDeleteUser,
} from "../../hooks/useElastiCache";
import {
  useBatchComputeEnvironments,
  useCreateBatchComputeEnvironment,
  useDeleteBatchComputeEnvironment,
  useBatchJobQueues,
  useCreateBatchJobQueue,
  useDeleteBatchJobQueue,
  useBatchJobDefinitions,
  useRegisterBatchJobDefinition,
  useDeregisterBatchJobDefinition,
  useSubmitBatchJob,
  useTerminateBatchJob,
} from "../../hooks/useBatch";
import {
  useDocDBClusters,
  useCreateDocDBCluster,
  useDeleteDocDBCluster,
  useDocDBInstances,
  useCreateDocDBInstance,
  useDeleteDocDBInstance,
} from "../../hooks/useDocDB";
import {
  useEMRClusters,
  useRunEMRJobFlow,
  useTerminateEMRJobFlows,
  useEMRSecurityConfigurations,
  useCreateEMRSecurityConfiguration,
  useDeleteEMRSecurityConfiguration,
} from "../../hooks/useEMR";
import {
  useExecuteRDSDataStatement,
  useBeginRDSDataTransaction,
  useCommitRDSDataTransaction,
  useRollbackRDSDataTransaction,
} from "../../hooks/useRDSData";
import { useEc2Messages, useAcknowledgeMessage } from "../../hooks/useEc2Messages";
import { useStartConfigurationSession, useGetLatestConfiguration } from "../../hooks/useAppConfigData";
import { useMemoryDBClusters, useCreateMemoryDBCluster, useDeleteMemoryDBCluster } from "../../hooks/useMemoryDB";

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

export function CloudWatchLogsDashboard() {
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
