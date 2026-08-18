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
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
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
  useECSAccountSettings,
  usePutECSAccountSetting,
  useDeleteECSAccountSetting,
  useECSTaskSets,
  useCreateECSTaskSet,
  useSetPrimaryECSTaskSet,
  useDeleteECSTaskSet,
  useECSContainerInstances,
  useDeregisterECSContainerInstance,
  useUpdateECSContainerInstancesState,
  useUpdateECSContainerAgent,
  useStartECSTask,
  useECSTaskProtection,
  useUpdateECSTaskProtection,
  useDiscoverECSPollEndpoint,
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

export function ECSDashboard() {
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

  const clustersTab = (
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

  if (isError) {
    return (
      <Alert type="error" header="Failed to load ECS clusters">
        {(error as Error)?.message || "Unknown error"}
      </Alert>
    );
  }

  return (
    <Tabs
      tabs={[
        { label: "Clusters", id: "clusters", content: clustersTab },
        { label: "Account Settings", id: "account-settings", content: <ECSAccountSettingsTab /> },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  ECS Account Settings
// ────────────────────────────────────────────────────────

const ECS_ACCOUNT_SETTING_NAMES: SelectProps.Option[] = [
  { label: "containerInsights", value: "containerInsights" },
  { label: "serviceLongArnFormat", value: "serviceLongArnFormat" },
  { label: "taskLongArnFormat", value: "taskLongArnFormat" },
  { label: "containerInstanceLongArnFormat", value: "containerInstanceLongArnFormat" },
  { label: "awsvpcTrunking", value: "awsvpcTrunking" },
  { label: "tagResourceAuthorization", value: "tagResourceAuthorization" },
];

function ECSAccountSettingsTab() {
  const { showToast } = useToast();
  const settingsQuery = useECSAccountSettings();
  const putSetting = usePutECSAccountSetting();
  const deleteSetting = useDeleteECSAccountSetting();

  const [showEdit, setShowEdit] = useState(false);
  const [settingName, setSettingName] = useState<SelectProps.Option | null>(ECS_ACCOUNT_SETTING_NAMES[0]);
  const [settingValue, setSettingValue] = useState<SelectProps.Option | null>({ label: "enabled", value: "enabled" });
  const [isDefault, setIsDefault] = useState(false);

  const settings = settingsQuery.data?.settings || [];

  const columns = [
    { id: "name", header: "Name", cell: (item: any) => item.name || "—", isRowHeader: true },
    { id: "value", header: "Value", cell: (item: any) => <StatusBadge status={item.value || "—"} /> },
    { id: "principal", header: "Principal", cell: (item: any) => item.principalArn || "account default" },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <DeleteButton
          itemName={item.name}
          resourceType="account setting"
          loading={deleteSetting.isPending}
          onDelete={() =>
            deleteSetting.mutateAsync(item.name).then(
              () => showToast("success", `Reset "${item.name}" to default`),
              (err) => showToast("error", (err as Error)?.message || "Failed to delete setting"),
            )
          }
        />
      ),
    },
  ];

  return (
    <>
      <ResourceTable
        resourceName="Account Setting"
        headerTitle="Account Settings"
        headerCounter={settingsQuery.data?.total}
        items={settings}
        columns={columns}
        loading={settingsQuery.isLoading}
        emptyMessage="No account settings configured."
        onCreate={() => setShowEdit(true)}
      />

      <Modal
        visible={showEdit}
        onDismiss={() => setShowEdit(false)}
        header="Put account setting"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putSetting.isPending}
                disabled={!settingName?.value || !settingValue?.value}
                onClick={() => {
                  putSetting.mutate(
                    { name: settingName!.value!, value: settingValue!.value!, isDefault },
                    {
                      onSuccess: () => {
                        showToast("success", `Set ${settingName!.value} to ${settingValue!.value}`);
                        setShowEdit(false);
                      },
                      onError: (err) => showToast("error", (err as Error)?.message || "Failed to put setting"),
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
            <FormField label="Setting name">
              <Select
                selectedOption={settingName}
                onChange={({ detail }) => setSettingName(detail.selectedOption)}
                options={ECS_ACCOUNT_SETTING_NAMES}
              />
            </FormField>
            <FormField label="Value">
              <Select
                selectedOption={settingValue}
                onChange={({ detail }) => setSettingValue(detail.selectedOption)}
                options={[
                  { label: "enabled", value: "enabled" },
                  { label: "disabled", value: "disabled" },
                ]}
              />
            </FormField>
            <FormField label="Scope">
              <Checkbox checked={isDefault} onChange={({ detail }) => setIsDefault(detail.checked)}>
                Apply as account default (all IAM users/roles)
              </Checkbox>
            </FormField>
          </SpaceBetween>
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
  const containerInstancesQuery = useECSContainerInstances(clusterName);
  const deregisterInstance = useDeregisterECSContainerInstance();
  const updateInstanceState = useUpdateECSContainerInstancesState();
  const updateContainerAgent = useUpdateECSContainerAgent();
  const startTask = useStartECSTask();
  const [showRunTask, setShowRunTask] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);
  const [taskDefInput, setTaskDefInput] = useState("");
  const [showStartTask, setShowStartTask] = useState(false);
  const [startTaskForm, setStartTaskForm] = useState({ taskDefinition: "", containerInstances: "", group: "", startedBy: "" });
  const [stateTarget, setStateTarget] = useState<{ arn: string; status: string } | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);
  const [startTaskError, setStartTaskError] = useState<string | null>(null);
  const [protectionTaskId, setProtectionTaskId] = useState<string | null>(null);
  const [protectEnabled, setProtectEnabled] = useState(true);
  const [protectExpires, setProtectExpires] = useState("");
  const taskProtectionQuery = useECSTaskProtection(clusterName, protectionTaskId);
  const updateTaskProtection = useUpdateECSTaskProtection();
  const discoverPollEndpoint = useDiscoverECSPollEndpoint();
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
                        taskDefinition: detail.selectedOption?.value!,
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
                      setServiceForm((p) => ({ ...p, launchType: detail.selectedOption?.value! }))
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
                cell: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => { setProtectionTaskId(item.taskArn); setProtectEnabled(true); setProtectExpires(""); }}>
                      Protection
                    </Button>
                    {item.lastStatus !== "STOPPED" && (
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
                    )}
                  </SpaceBetween>
                ),
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
    {
      label: "Task Sets",
      id: "task-sets",
      content: <ECSTaskSetsTab clusterName={clusterName} services={servicesQuery.data?.services || []} />,
    },
    {
      label: `Container Instances (${containerInstancesQuery.data?.total || 0})`,
      id: "container-instances",
      content: (
        <>
          <ResourceTable
            resourceName="Container Instance"
            headerTitle="Container Instances"
            headerCounter={containerInstancesQuery.data?.total}
            items={containerInstancesQuery.data?.containerInstances || []}
            columns={[
              { id: "arn", header: "Container Instance ARN", cell: (item: any) => item.containerInstanceArn?.split("/").pop() || "—", isRowHeader: true },
              { id: "status", header: "Status", cell: (item: any) => <StatusBadge status={item.status || "ACTIVE"} /> },
              { id: "agent", header: "Agent", cell: (item: any) => (item.agentConnected ? "Connected" : "Disconnected") },
              { id: "running", header: "Running Tasks", cell: (item: any) => item.runningTasksCount ?? 0 },
              { id: "pending", header: "Pending Tasks", cell: (item: any) => item.pendingTasksCount ?? 0 },
              {
                id: "actions",
                header: "",
                cell: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setStateTarget({ arn: item.containerInstanceArn, status: item.status || "ACTIVE" })}>
                      Update state
                    </Button>
                    <Button
                      variant="link"
                      onClick={() =>
                        updateContainerAgent
                          .mutateAsync({ cluster: clusterName, containerInstance: item.containerInstanceArn })
                          .then(
                            () => showToast("success", "Container agent updated"),
                            (err) => showToast("error", (err as Error)?.message || "Failed to update agent"),
                          )
                      }
                    >
                      Update agent
                    </Button>
                    <Button
                      variant="link"
                      onClick={() =>
                        discoverPollEndpoint
                          .mutateAsync(item.containerInstanceArn)
                          .then(
                            (d: any) => showToast("success", `Poll endpoint: ${d?.endpoint || "—"}`),
                            (err) => showToast("error", (err as Error)?.message || "Failed to discover poll endpoint"),
                          )
                      }
                    >
                      Poll endpoint
                    </Button>
                    <DeleteButton
                      itemName={item.containerInstanceArn?.split("/").pop() || "instance"}
                      resourceType="container instance"
                      loading={deregisterInstance.isPending}
                      onDelete={() =>
                        deregisterInstance
                          .mutateAsync({ cluster: clusterName, containerInstance: item.containerInstanceArn, force: true })
                          .then(
                            () => showToast("success", "Container instance deregistered"),
                            (err) => showToast("error", (err as Error)?.message || "Failed to deregister container instance"),
                          )
                      }
                    />
                  </SpaceBetween>
                ),
              },
            ]}
            loading={containerInstancesQuery.isLoading}
            emptyMessage="No container instances in this cluster."
            filterEnabled
            filterPlaceholder="Find container instances"
            filterFunction={(item: any, s: string) =>
              (item.containerInstanceArn || "").toLowerCase().includes(s.toLowerCase())
            }
            onCreate={() => setShowStartTask(true)}
          />
          <Modal
            visible={showStartTask}
            onDismiss={() => { setShowStartTask(false); setStartTaskForm({ taskDefinition: "", containerInstances: "", group: "", startedBy: "" }); }}
            header="Start task on instances"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowStartTask(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    loading={startTask.isPending}
                    disabled={!startTaskForm.taskDefinition.trim()}
                    onClick={() => {
                      setStartTaskError(null);
                      startTask.mutate(
                        {
                          cluster: clusterName,
                          taskDefinition: startTaskForm.taskDefinition.trim(),
                          containerInstances: startTaskForm.containerInstances
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter(Boolean),
                          group: startTaskForm.group.trim() || undefined,
                          startedBy: startTaskForm.startedBy.trim() || undefined,
                        },
                        {
                          onSuccess: () => {
                            setShowStartTask(false);
                            setStartTaskForm({ taskDefinition: "", containerInstances: "", group: "", startedBy: "" });
                            showToast("success", "Task started");
                          },
                          onError: (err) => setStartTaskError((err as Error)?.message || "Failed to start task"),
                        }
                      );
                    }}
                  >
                    Start
                  </Button>
                </SpaceBetween>
              </Box>
            }
          >
            <Form>
              {startTaskError && (
                <Alert type="error" dismissible onDismiss={() => setStartTaskError(null)}>
                  {startTaskError}
                </Alert>
              )}
              <SpaceBetween size="m">
                <FormField label="Task definition" description="Family:revision or ARN.">
                  <Input
                    value={startTaskForm.taskDefinition}
                    onChange={({ detail }) => setStartTaskForm((p) => ({ ...p, taskDefinition: detail.value }))}
                    placeholder="my-task:1"
                  />
                </FormField>
                <FormField
                  label="Container instances"
                  description="Comma-separated ARNs. Leave empty to let ECS pick."
                >
                  <Input
                    value={startTaskForm.containerInstances}
                    onChange={({ detail }) => setStartTaskForm((p) => ({ ...p, containerInstances: detail.value }))}
                    placeholder="arn:aws:ecs:...:container-instance/..."
                  />
                </FormField>
                <FormField label="Group">
                  <Input
                    value={startTaskForm.group}
                    onChange={({ detail }) => setStartTaskForm((p) => ({ ...p, group: detail.value }))}
                    placeholder="family:my-task"
                  />
                </FormField>
                <FormField label="Started by">
                  <Input
                    value={startTaskForm.startedBy}
                    onChange={({ detail }) => setStartTaskForm((p) => ({ ...p, startedBy: detail.value }))}
                    placeholder="dashboard"
                  />
                </FormField>
              </SpaceBetween>
            </Form>
          </Modal>
          <Modal
            visible={!!stateTarget}
            onDismiss={() => setStateTarget(null)}
            header="Update container instance state"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setStateTarget(null)}>Cancel</Button>
                  <Button
                    variant="primary"
                    loading={updateInstanceState.isPending}
                    onClick={() => {
                      setStateError(null);
                      updateInstanceState.mutate(
                        {
                          cluster: clusterName,
                          containerInstances: [stateTarget!.arn],
                          status: stateTarget!.status,
                        },
                        {
                          onSuccess: () => {
                            setStateTarget(null);
                            showToast("success", `Instance state updated to ${stateTarget!.status}`);
                          },
                          onError: (err) => setStateError((err as Error)?.message || "Failed to update instance state"),
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
              {stateError && (
                <Alert type="error" dismissible onDismiss={() => setStateError(null)}>
                  {stateError}
                </Alert>
              )}
              <FormField label="New status">
                <Select
                  selectedOption={{ label: stateTarget?.status || "", value: stateTarget?.status || "" }}
                  onChange={({ detail }) =>
                    setStateTarget((p) => ({ ...p!, status: detail.selectedOption?.value! }))
                  }
                  options={[
                    { label: "ACTIVE", value: "ACTIVE" },
                    { label: "DRAINING", value: "DRAINING" },
                    { label: "STOPPED", value: "STOPPED" },
                  ]}
                />
              </FormField>
            </Form>
          </Modal>
        </>
      ),
    },
  ];

  const currentTask = (tasksQuery.data?.tasks || []).find((t: any) => t.taskArn === protectionTaskId);
  const protection = (taskProtectionQuery.data?.protections || [])[0];
  const protectionLoading = taskProtectionQuery.isLoading;
  const protectionError = taskProtectionQuery.isError
    ? (taskProtectionQuery.error as Error)?.message || "Failed to load protection"
    : null;

  return (
    <SpaceBetween size="l">
      <Box variant="h2">{clusterName}</Box>
      <ServiceDashboardLayout
        tabs={tabs}
        backButton={
          <Button variant="link" iconName="arrow-left" onClick={onBack}>
            Clusters
          </Button>
        }
      />
      <Modal
        visible={!!protectionTaskId}
        onDismiss={() => setProtectionTaskId(null)}
        header={`Task protection — ${currentTask?.taskArn?.split("/").pop() || protectionTaskId?.split("/").pop() || ""}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setProtectionTaskId(null)}>Cancel</Button>
              <Button
                variant="primary"
                loading={updateTaskProtection.isPending}
                disabled={!protectionTaskId}
                onClick={() => {
                  updateTaskProtection.mutate(
                    {
                      cluster: clusterName,
                      tasks: [protectionTaskId!],
                      protectionEnabled: protectEnabled,
                      expiresInMinutes: protectExpires ? Number(protectExpires) : undefined,
                    },
                    {
                      onSuccess: () => {
                        setProtectionTaskId(null);
                        showToast("success", protectEnabled ? "Task protection enabled" : "Task protection disabled");
                      },
                      onError: (err) => showToast("error", (err as Error)?.message || "Failed to update task protection"),
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
          {protectionError && (
            <Alert type="error" dismissible>
              {protectionError}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Current protection">
              {protectionLoading ? (
                <Spinner />
              ) : (
                <StatusIndicator type={protection?.protectionEnabled ? "success" : "pending"}>
                  {protection?.protectionEnabled ? "Enabled" : "Not protected"}
                </StatusIndicator>
              )}
            </FormField>
            <FormField label="Protection status">
              <Checkbox
                checked={protectEnabled}
                onChange={({ detail }) => setProtectEnabled(detail.checked)}
              >
                Enable scale-in protection for this task
              </Checkbox>
            </FormField>
            <FormField label="Expires in (minutes)" description="Optional — how long protection lasts.">
              <Input
                type="number"
                value={protectExpires}
                onChange={({ detail }) => setProtectExpires(detail.value)}
                placeholder="120"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  ECS Task Sets (per service, EXTERNAL deployment controller)
// ────────────────────────────────────────────────────────

function ECSTaskSetsTab({ clusterName, services }: { clusterName: string; services: any[] }) {
  const { showToast } = useToast();
  const [selectedService, setSelectedService] = useState<SelectProps.Option | null>(null);
  const serviceName = selectedService?.value || null;

  const taskSetsQuery = useECSTaskSets(clusterName, serviceName);
  const createTaskSet = useCreateECSTaskSet();
  const setPrimary = useSetPrimaryECSTaskSet();
  const deleteTaskSet = useDeleteECSTaskSet();

  const [showCreate, setShowCreate] = useState(false);
  const [taskDefinition, setTaskDefinition] = useState("");

  const serviceOptions = services.map((s: any) => ({ label: s.serviceName, value: s.serviceName }));
  const taskSets = taskSetsQuery.data?.taskSets || [];

  const columns = [
    { id: "id", header: "Task Set ID", cell: (item: any) => item.id || "—", isRowHeader: true },
    { id: "status", header: "Status", cell: (item: any) => <StatusBadge status={item.status || "—"} /> },
    { id: "taskDef", header: "Task Definition", cell: (item: any) => item.taskDefinition?.split("/").pop() || "—" },
    { id: "running", header: "Running", cell: (item: any) => item.runningCount ?? 0 },
    { id: "desired", header: "Desired", cell: (item: any) => item.computedDesiredCount ?? 0 },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          {item.status !== "PRIMARY" && (
            <Button
              variant="link"
              onClick={() =>
                setPrimary.mutateAsync({ cluster: clusterName, service: serviceName!, primaryTaskSet: item.id }).then(
                  () => showToast("success", `Task set "${item.id}" set as primary`),
                  (err) => showToast("error", (err as Error)?.message || "Failed to set primary"),
                )
              }
            >
              Make primary
            </Button>
          )}
          <DeleteButton
            itemName={item.id}
            resourceType="task set"
            loading={deleteTaskSet.isPending}
            onDelete={() =>
              deleteTaskSet.mutateAsync({ cluster: clusterName, service: serviceName!, taskSet: item.id, force: true }).then(
                () => showToast("success", `Task set "${item.id}" deleted`),
                (err) => showToast("error", (err as Error)?.message || "Failed to delete task set"),
              )
            }
          />
        </SpaceBetween>
      ),
    },
  ];

  return (
    <SpaceBetween size="m">
      <Container header={<Header variant="h3">Task set service</Header>}>
        <FormField label="Service" description="Task sets belong to a service using the EXTERNAL deployment controller.">
          <Select
            selectedOption={selectedService}
            onChange={({ detail }) => setSelectedService(detail.selectedOption)}
            options={serviceOptions}
            placeholder="Choose a service"
            empty="No services in this cluster"
            filteringType="auto"
          />
        </FormField>
      </Container>

      {serviceName && (
        <ResourceTable
          resourceName="Task Set"
          headerTitle={`Task Sets — ${serviceName}`}
          headerCounter={taskSetsQuery.data?.total}
          items={taskSets}
          columns={columns}
          loading={taskSetsQuery.isLoading}
          emptyMessage="No task sets for this service."
          onCreate={() => setShowCreate(true)}
        />
      )}

      <Modal
        visible={showCreate}
        onDismiss={() => { setShowCreate(false); setTaskDefinition(""); }}
        header="Create task set"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createTaskSet.isPending}
                disabled={!taskDefinition.trim() || !serviceName}
                onClick={() => {
                  createTaskSet.mutate(
                    { cluster: clusterName, service: serviceName, taskDefinition: taskDefinition.trim() },
                    {
                      onSuccess: () => {
                        showToast("success", "Task set created");
                        setShowCreate(false);
                        setTaskDefinition("");
                      },
                      onError: (err) => showToast("error", (err as Error)?.message || "Failed to create task set"),
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
          <FormField label="Task definition" description="Family:revision or ARN.">
            <Input
              value={taskDefinition}
              onChange={({ detail }) => setTaskDefinition(detail.value)}
              placeholder="my-task-def:1"
            />
          </FormField>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  API Gateway
// ────────────────────────────────────────────────────────

