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
import { useMemoryDBClusters, useCreateMemoryDBCluster, useDeleteMemoryDBCluster, useMemoryDBUsers, useCreateMemoryDBUser, useDeleteMemoryDBUser, useMemoryDBACLs, useCreateMemoryDBACL, useDeleteMemoryDBACL } from "../../hooks/useMemoryDB";

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

function ClustersTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useMemoryDBClusters();
  const createCluster = useCreateMemoryDBCluster();
  const deleteCluster = useDeleteMemoryDBCluster();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodeType, setNodeType] = useState("db.t4g.small");
  const [engine, setEngine] = useState("redis");

  const clusters = (data as any)?.clusters || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Cluster"
        headerTitle="Clusters"
        headerCounter={clusters.length}
        items={clusters.map((c: any) => ({
          name: c.Name,
          status: c.Status || "-",
          nodeType: c.NodeType || "-",
          engine: c.Engine || "-",
          shards: c.NumberOfShards ?? "-",
          endpoint: c.ClusterEndpoint ? `${c.ClusterEndpoint.Address}:${c.ClusterEndpoint.Port}` : "-",
        }))}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "status", header: "Status", cell: (i: any) => i.status },
          { id: "nodeType", header: "Node Type", cell: (i: any) => i.nodeType },
          { id: "engine", header: "Engine", cell: (i: any) => i.engine },
          { id: "shards", header: "Shards", cell: (i: any) => i.shards },
          { id: "endpoint", header: "Endpoint", cell: (i: any) => i.endpoint },
          { id: "actions", header: "", cell: (i: any) => (
            <DeleteButton
              itemName={i.name}
              resourceType="cluster"
              loading={deleteCluster.isPending && deleteCluster.variables === i.name}
              onDelete={async () => {
                try {
                  await deleteCluster.mutateAsync(i.name);
                  showToast("success", `Cluster ${i.name} deleted`);
                } catch (e: any) { showToast("error", e.message); }
              }}
            />
          )},
        ]}
        loading={isLoading}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Cluster"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createCluster.isPending}
                disabled={!name.trim()}
                onClick={() => {
                  createCluster.mutate(
                    {
                      clusterName: name.trim(),
                      description: description.trim(),
                      nodeType: nodeType.trim(),
                      engine: engine.trim(),
                    },
                    {
                      onSuccess: () => {
                        setShowCreate(false);
                        setName("");
                        setDescription("");
                        showToast("success", `Cluster ${name} created`);
                      },
                      onError: (e: any) => showToast("error", e.message),
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
        <SpaceBetween size="s">
          <FormField label="Cluster name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-cluster" />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="Optional description" />
          </FormField>
          <FormField label="Node type">
            <Input value={nodeType} onChange={({ detail }) => setNodeType(detail.value)} placeholder="db.t4g.small" />
          </FormField>
          <FormField label="Engine">
            <Input value={engine} onChange={({ detail }) => setEngine(detail.value)} placeholder="redis" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}

function UsersTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useMemoryDBUsers();
  const createUser = useCreateMemoryDBUser();
  const deleteUser = useDeleteMemoryDBUser();
  const [showCreate, setShowCreate] = useState(false);
  const [userName, setUserName] = useState("");
  const [accessString, setAccessString] = useState("on ~* +@all");

  const users = (data as any)?.users || [];

  const handleDeleteUser = async (name: string) => {
    try {
      await deleteUser.mutateAsync(name);
      showToast("success", `User ${name} deleted`);
    } catch (e: any) { showToast("error", e.message); }
  };

  const handleCreateUser = () => {
    createUser.mutate(
      { userName: userName.trim(), accessString },
      {
        onSuccess: () => {
          setShowCreate(false);
          setUserName("");
          setAccessString("on ~* +@all");
          showToast("success", `User ${userName} created`);
        },
        onError: (e: any) => showToast("error", e.message),
      }
    );
  };

  /* v8 ignore start */
  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="User"
        headerTitle="Users"
        headerCounter={users.length}
        items={users.map((u: any) => ({
          name: u.UserName,
          status: u.Status || "-",
          accessString: u.AccessString || "-",
        }))}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "status", header: "Status", cell: (i: any) => i.status },
          { id: "accessString", header: "Access String", cell: (i: any) => i.accessString },
          { id: "actions", header: "", cell: (i: any) => (
            <DeleteButton
              itemName={i.name}
              resourceType="user"
              loading={deleteUser.isPending && deleteUser.variables === i.name}
              onDelete={() => handleDeleteUser(i.name)}
            />
          )},
        ]}
        loading={isLoading}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create User"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={createUser.isPending} disabled={!userName.trim()} onClick={handleCreateUser}>
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="s">
          <FormField label="User name">
            <Input value={userName} onChange={({ detail }) => setUserName(detail.value)} placeholder="my-user" />
          </FormField>
          <FormField label="Access string">
            <Input value={accessString} onChange={({ detail }) => setAccessString(detail.value)} placeholder="on ~* +@all" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
  /* v8 ignore end */
}

function ACLsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useMemoryDBACLs();
  const createACL = useCreateMemoryDBACL();
  const deleteACL = useDeleteMemoryDBACL();
  const [showCreate, setShowCreate] = useState(false);
  const [aclName, setACLName] = useState("");
  const [userNames, setUserNames] = useState("");

  const acls = (data as any)?.acls || [];

  const handleDeleteACL = async (name: string) => {
    try {
      await deleteACL.mutateAsync(name);
      showToast("success", `ACL ${name} deleted`);
    } catch (e: any) { showToast("error", e.message); }
  };

  const handleCreateACL = () => {
    const names = userNames.split(",").map((s) => s.trim()).filter(Boolean);
    createACL.mutate(
      { aclName: aclName.trim(), userNames: names.length ? names : undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setACLName("");
          setUserNames("");
          showToast("success", `ACL ${aclName} created`);
        },
        onError: (e: any) => showToast("error", e.message),
      }
    );
  };

  /* v8 ignore start */
  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="ACL"
        headerTitle="ACLs"
        headerCounter={acls.length}
        items={acls.map((a: any) => ({
          name: a.ACLName,
          status: a.Status || "-",
          userNames: (a.UserNames || []).join(", ") || "-",
        }))}
        columns={
          [
            { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
            { id: "status", header: "Status", cell: (i: any) => i.status },
            { id: "userNames", header: "Users", cell: (i: any) => i.userNames },
            { id: "actions", header: "", cell: (i: any) => (
              <DeleteButton
                itemName={i.name}
                resourceType="ACL"
                loading={deleteACL.isPending && deleteACL.variables === i.name}
                onDelete={() => handleDeleteACL(i.name)}
              />
            )},
          ]
        }
        loading={isLoading}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create ACL"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={createACL.isPending} disabled={!aclName.trim()} onClick={handleCreateACL}>
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="s">
          <FormField label="ACL name">
            <Input value={aclName} onChange={({ detail }) => setACLName(detail.value)} placeholder="my-acl" />
          </FormField>
          <FormField label="User names (comma-separated)">
            <Input value={userNames} onChange={({ detail }) => setUserNames(detail.value)} placeholder="user1, user2" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
  /* v8 ignore end */
}

export function MemoryDBDashboard() {
  const [activeTab, setActiveTab] = useState("clusters");

  return (
    <SpaceBetween size="l">
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={[
          { id: "clusters", label: "Clusters", content: <ClustersTab /> },
          { id: "users", label: "Users", content: <UsersTab /> },
          { id: "acls", label: "ACLs", content: <ACLsTab /> },
        ]}
      />
    </SpaceBetween>
  );
}

