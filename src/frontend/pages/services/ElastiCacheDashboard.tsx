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

export function ElastiCacheDashboard() {
  const [selectedTab, setSelectedTab] = useState("replication-groups");

  const tabs: TabsProps.Tab[] = [
    {
      id: "replication-groups",
      label: "Replication Groups",
      content: <ElastiCacheReplicationGroupSection />,
    },
    {
      id: "cache-clusters",
      label: "Cache Clusters",
      content: <ElastiCacheCacheClusterSection />,
    },
    {
      id: "users",
      label: "Users",
      content: <ElastiCacheUserSection />,
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

// ─── Replication Groups ─────────────────────────────────


function ElastiCacheReplicationGroupSection() {
  const { data, isLoading, isError, error } = useElastiCacheReplicationGroups();
  const create = useElastiCacheCreateReplicationGroup();
  const deleteRG = useElastiCacheDeleteReplicationGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ReplicationGroupId: "", Description: "", AuthToken: "" });

  const items = (data?.replicationGroups || []).map((rg: any) => ({
    id: rg.ReplicationGroupId,
    status: rg.Status,
    description: rg.Description || "\u2014",
    memberClusters: (rg.MemberClusters || []).length,
    snapshotRetention: rg.SnapshotRetentionLimit ?? "\u2014",
  }));

  function resetForm() {
    setForm({ ReplicationGroupId: "", Description: "", AuthToken: "" });
  }

  function handleCreate() {
    if (!form.ReplicationGroupId.trim()) return;
    const body: any = { ReplicationGroupId: form.ReplicationGroupId.trim() };
    if (form.Description.trim()) body.Description = form.Description.trim();
    if (form.AuthToken.trim()) body.AuthToken = form.AuthToken.trim();
    create.mutate(body, {
      onSuccess: () => {
        setShowCreate(false);
        resetForm();
      },
    });
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load replication groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Replication Group"
        headerTitle="Replication Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "Replication Group ID",
            cell: (item: any) => item.id,
            isRowHeader: true,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "available"
                    ? "success"
                    : item.status === "creating" || item.status === "modifying"
                    ? "in-progress"
                    : "warning"
                }
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "clusters",
            header: "Member Clusters",
            cell: (item: any) => item.memberClusters,
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
                itemName={item.id}
                resourceType="replication group"
                loading={deleteRG.isPending && deleteRG.variables?.ReplicationGroupId === item.id}
                onDelete={() => deleteRG.mutateAsync({ ReplicationGroupId: item.id })}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No replication groups found"
        filterEnabled
        filterPlaceholder="Find replication groups by ID"
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
        header="Create Replication Group"
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
                loading={create.isPending}
                disabled={!form.ReplicationGroupId.trim()}
                onClick={handleCreate}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {create.isError && (
            <Alert type="error" dismissible>
              {(create.error as Error)?.message || "Failed to create replication group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Replication Group ID"
              description="Must be unique. Use lowercase letters, hyphens, and numbers."
            >
              <Input
                value={form.ReplicationGroupId}
                onChange={({ detail }) => setForm((p) => ({ ...p, ReplicationGroupId: detail.value }))}
                placeholder="my-rg"
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.Description}
                onChange={({ detail }) => setForm((p) => ({ ...p, Description: detail.value }))}
                placeholder="My replication group"
              />
            </FormField>
            <FormField
              label="Auth Token (optional)"
              description="Sets AUTH token for Redis/Valkey password authentication."
            >
              <Input
                type="password"
                value={form.AuthToken}
                onChange={({ detail }) => setForm((p) => ({ ...p, AuthToken: detail.value }))}
                placeholder="my-auth-token"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Cache Clusters ─────────────────────────────────────


function ElastiCacheCacheClusterSection() {
  const { data, isLoading, isError, error } = useElastiCacheCacheClusters();
  const create = useElastiCacheCreateCacheCluster();
  const deleteCC = useElastiCacheDeleteCacheCluster();

  const [showCreate, setShowCreate] = useState(false);
  const [CacheClusterId, setCacheClusterId] = useState("");

  const items = (data?.cacheClusters || []).map((cc: any) => ({
    id: cc.CacheClusterId,
    engine: cc.Engine,
    status: cc.CacheClusterStatus,
    numNodes: cc.NumCacheNodes ?? "\u2014",
    cacheNodeType: cc.CacheNodeType || "\u2014",
  }));

  function handleCreate() {
    if (!CacheClusterId.trim()) return;
    create.mutate(
      { CacheClusterId: CacheClusterId.trim() },
      {
        onSuccess: () => {
          setShowCreate(false);
          setCacheClusterId("");
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load cache clusters"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Cache Cluster"
        headerTitle="Cache Clusters"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "Cache Cluster ID",
            cell: (item: any) => item.id,
            isRowHeader: true,
          },
          {
            id: "engine",
            header: "Engine",
            cell: (item: any) => item.engine,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "available"
                    ? "success"
                    : item.status === "creating" || item.status === "modifying"
                    ? "in-progress"
                    : "warning"
                }
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "type",
            header: "Node Type",
            cell: (item: any) => item.cacheNodeType,
          },
          {
            id: "nodes",
            header: "Nodes",
            cell: (item: any) => item.numNodes,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="cache cluster"
                loading={deleteCC.isPending && deleteCC.variables?.CacheClusterId === item.id}
                onDelete={() => deleteCC.mutateAsync({ CacheClusterId: item.id })}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No cache clusters found"
        filterEnabled
        filterPlaceholder="Find clusters by ID"
        filterFunction={(item: any, searchText: string) =>
          item.id.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          setCacheClusterId("");
        }}
        header="Create Cache Cluster"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  setCacheClusterId("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={create.isPending}
                disabled={!CacheClusterId.trim()}
                onClick={handleCreate}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {create.isError && (
            <Alert type="error" dismissible>
              {(create.error as Error)?.message || "Failed to create cache cluster"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Cache Cluster ID"
              description="Must be unique. Use lowercase letters, hyphens, and numbers."
            >
              <Input
                value={CacheClusterId}
                onChange={({ detail }) => setCacheClusterId(detail.value)}
                placeholder="my-cache-cluster"
              />
            </FormField>
            <FormField label="Engine">
              <Select
                selectedOption={ELASTICACHE_ENGINE_OPTIONS[0]}
                options={ELASTICACHE_ENGINE_OPTIONS}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Users ──────────────────────────────────────────────


function ElastiCacheUserSection() {
  const { data, isLoading, isError, error } = useElastiCacheUsers();
  const create = useElastiCacheCreateUser();
  const deleteUser = useElastiCacheDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ UserId: "", UserName: "", AccessString: "" });

  const items = (data?.users || []).map((u: any) => ({
    id: u.UserId,
    userName: u.UserName,
    status: u.Status || "\u2014",
    accessString: u.AccessString || "\u2014",
    engine: u.Engine || "\u2014",
  }));

  function resetForm() {
    setForm({ UserId: "", UserName: "", AccessString: "" });
  }

  function handleCreate() {
    if (!form.UserId.trim()) return;
    const body: any = { UserId: form.UserId.trim() };
    if (form.UserName.trim()) body.UserName = form.UserName.trim();
    if (form.AccessString.trim()) body.AccessString = form.AccessString.trim();
    create.mutate(body, {
      onSuccess: () => {
        setShowCreate(false);
        resetForm();
      },
    });
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load users"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="User"
        headerTitle="ElastiCache Users"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "User ID",
            cell: (item: any) => item.id,
            isRowHeader: true,
          },
          {
            id: "userName",
            header: "User Name",
            cell: (item: any) => item.userName,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "active"
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
            id: "engine",
            header: "Engine",
            cell: (item: any) => item.engine,
          },
          {
            id: "accessString",
            header: "Access String",
            cell: (item: any) => (
              <span style={{ fontFamily: "monospace", fontSize: "0.85em" }}>
                {item.accessString}
              </span>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="user"
                loading={deleteUser.isPending && deleteUser.variables?.UserId === item.id}
                onDelete={() => deleteUser.mutateAsync({ UserId: item.id })}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No users found"
        filterEnabled
        filterPlaceholder="Find users by ID"
        filterFunction={(item: any, searchText: string) =>
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.userName.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create ElastiCache User"
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
                loading={create.isPending}
                disabled={!form.UserId.trim()}
                onClick={handleCreate}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {create.isError && (
            <Alert type="error" dismissible>
              {(create.error as Error)?.message || "Failed to create user"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="User ID"
              description="A unique identifier for the user."
            >
              <Input
                value={form.UserId}
                onChange={({ detail }) => setForm((p) => ({ ...p, UserId: detail.value }))}
                placeholder="my-user"
              />
            </FormField>
            <FormField label="User Name (optional)">
              <Input
                value={form.UserName}
                onChange={({ detail }) => setForm((p) => ({ ...p, UserName: detail.value }))}
                placeholder="My User"
              />
            </FormField>
            <FormField
              label="Access String (optional)"
              description="Redis ACL access string (e.g. 'on ~* +@all')."
            >
              <Input
                value={form.AccessString}
                onChange={({ detail }) => setForm((p) => ({ ...p, AccessString: detail.value }))}
                placeholder="on ~* +@all"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  AWS Batch
// ────────────────────────────────────────────────────────


const ELASTICACHE_ENGINE_OPTIONS: SelectProps.Option[] = [
  { label: "Memcached", value: "memcached" },
];
