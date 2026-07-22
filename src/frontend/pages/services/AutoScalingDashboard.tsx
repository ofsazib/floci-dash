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
  useScalingPolicies,
  useCreateScalingPolicy,
  useDeleteScalingPolicy,
  useStartInstanceRefresh,
  useInstanceRefreshes,
  useCreateOrUpdateTags,
  useDeleteTags,
  useASGLoadBalancerTargetGroups,
  useAttachLBTargetGroups,
  useDetachLBTargetGroups,
  useASGLoadBalancers,
  useAttachLoadBalancers,
  useDetachLoadBalancers,
  useASGNotificationTypes,
  useASGTerminationPolicyTypes,
  useASGAdjustmentTypes,
  useASGAccountLimits,
  useASGLifecycleHookTypes,
  useASGMetricCollectionTypes,
  useLifecycleHooks,
  usePutLifecycleHook,
  useDeleteLifecycleHook,
  useCompleteLifecycleAction,
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

export function AutoScalingDashboard() {
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

  // ── Advanced State ──
  const [selectedASG, setSelectedASG] = useState<string | null>(null);
  const [minHealthy, setMinHealthy] = useState("90");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [tgArnsList, setTgArnsList] = useState("");
  const [lbNamesList, setLbNamesList] = useState("");
  const startRefresh = useStartInstanceRefresh();
  const instanceRefreshes = useInstanceRefreshes(selectedASG);
  const lbTargetGroups = useASGLoadBalancerTargetGroups(selectedASG);
  const asgLoadBalancers = useASGLoadBalancers(selectedASG);
  const createOrUpdateTags = useCreateOrUpdateTags();
  const deleteTags = useDeleteTags();
  const attachTGs = useAttachLBTargetGroups();
  const detachTGs = useDetachLBTargetGroups();
  const attachLBs = useAttachLoadBalancers();
  const detachLBs = useDetachLoadBalancers();
  const [showStartRefresh, setShowStartRefresh] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [showAttachTGs, setShowAttachTGs] = useState(false);
  const [showAttachLBs, setShowAttachLBs] = useState(false);

  // ── Scaling Policy State ──
  const scalingPolicies = useScalingPolicies(selectedASG);
  const createPolicy = useCreateScalingPolicy();
  const deletePolicy = useDeleteScalingPolicy();
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyType, setPolicyType] = useState("SimpleScaling");
  const [adjustmentType, setAdjustmentType] = useState("ChangeInCapacity");
  const [scalingAdjustment, setScalingAdjustment] = useState("1");
  const [policyCooldown, setPolicyCooldown] = useState("300");

  // ── Lifecycle Hook State ──
  const lifecycleHooks = useLifecycleHooks(selectedASG);
  const putHook = usePutLifecycleHook();
  const deleteHook = useDeleteLifecycleHook();
  const completeAction = useCompleteLifecycleAction();
  const [showCreateHook, setShowCreateHook] = useState(false);
  const [hookName, setHookName] = useState("");
  const [hookTransition, setHookTransition] = useState("autoscaling:EC2_INSTANCE_LAUNCHING");
  const [hookResult, setHookResult] = useState("ABANDON");
  const [hookTargetARN, setHookTargetARN] = useState("");
  const [hookRoleARN, setHookRoleARN] = useState("");
  const [showCompleteAction, setShowCompleteAction] = useState(false);
  const [completeHookName, setCompleteHookName] = useState("");
  const [completeActionResult, setCompleteActionResult] = useState("CONTINUE");

  // ── Handlers for inline JSX bypass (esbuild JSX parser limitation) ──
  const handleOpenCreatePolicy = () => {
    setShowCreatePolicy(true);
    setPolicyName("");
    setPolicyType("SimpleScaling");
    setAdjustmentType("ChangeInCapacity");
    setScalingAdjustment("1");
    setPolicyCooldown("300");
  };
  const handleOpenCompleteAction = () => {
    setShowCompleteAction(true);
    setCompleteHookName("");
    setCompleteActionResult("CONTINUE");
  };
  const handleOpenCreateHook = () => {
    setShowCreateHook(true);
    setHookName("");
    setHookTransition("autoscaling:EC2_INSTANCE_LAUNCHING");
    setHookResult("ABANDON");
    setHookTargetARN("");
    setHookRoleARN("");
  };

  // ── Header Variables ──
  const scalingPolicyHeader = (
    <Header variant="h2" actions={<Button onClick={handleOpenCreatePolicy}>Create policy</Button>}>
      Scaling Policies
    </Header>
  );
  const lifecycleHooksHeader = (
    <Header variant="h2" actions={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={handleOpenCompleteAction}>Complete action</Button>
        <Button onClick={handleOpenCreateHook}>Create hook</Button>
      </SpaceBetween>
    }>
      Lifecycle Hooks
    </Header>
  );

  // ── Describe Types ──
  const notificationTypes = useASGNotificationTypes();
  const terminationPolicyTypes = useASGTerminationPolicyTypes();
  const adjustmentTypes = useASGAdjustmentTypes();
  const accountLimits = useASGAccountLimits();
  const lifecycleHookTypes = useASGLifecycleHookTypes();
  const metricCollectionTypes = useASGMetricCollectionTypes();

  if (isLoading) return <TableSkeleton />;

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
        {
          id: "advanced",
          label: "Advanced",
          content: (
            <SpaceBetween size="l">
              {/* ASG Selector */}
              <FormField label="Select Auto Scaling Group">
                <Select
                  selectedOption={selectedASG ? { label: selectedASG, value: selectedASG } : null}
                  onChange={({ detail }) => setSelectedASG(detail.selectedOption?.value || null)}
                  options={(data?.groups || []).map((g: any) => ({
                    label: g.AutoScalingGroupName,
                    value: g.AutoScalingGroupName,
                  }))}
                  placeholder="Select an ASG..."
                />
              </FormField>

              {selectedASG && (
                <SpaceBetween size="l">
                  {/* Instance Refresh */}
                  <Container header={<Header variant="h2" actions={<Button onClick={() => setShowStartRefresh(true)}>Start Refresh</Button>}>
                    Instance Refresh
                  </Header>}>
                    {instanceRefreshes.data?.instanceRefreshes?.length ? (
                      <ResourceTable
                        resourceName="Instance Refresh"
                        items={instanceRefreshes.data.instanceRefreshes.map((r: any) => ({
                          id: r.instanceRefreshId,
                          status: r.status,
                          percent: r.percentageComplete + "%",
                          start: r.startTime ? new Date(r.startTime).toLocaleString() : "-",
                        }))}
                        columns={[
                          { id: "id", header: "Refresh ID", cell: (i: any) => i.id, isRowHeader: true },
                          { id: "status", header: "Status", cell: (i: any) => i.status },
                          { id: "percent", header: "Complete", cell: (i: any) => i.percent },
                          { id: "start", header: "Started", cell: (i: any) => i.start },
                        ]}
                        loading={instanceRefreshes.isLoading}
                        emptyMessage="No instance refreshes"
                      />
                    ) : (
                      <Box variant="small" color="text-status-inactive">No instance refreshes found.</Box>
                    )}
                  </Container>

                  {/* Tags */}
                  <Container header={<Header variant="h2" actions={<Button onClick={() => setShowAddTag(true)}>Add tag</Button>}>
                    Tags
                  </Header>}>
                    {(data?.groups?.find((g: any) => g.AutoScalingGroupName === selectedASG)?.Tags || []).length > 0 ? (
                      <ResourceTable
                        resourceName="Tag"
                        items={(data?.groups?.find((g: any) => g.AutoScalingGroupName === selectedASG)?.Tags || []).map((t: any) => ({
                          key: t.Key,
                          value: t.Value,
                        }))}
                        columns={[
                          { id: "key", header: "Key", cell: (i: any) => i.key, isRowHeader: true },
                          { id: "value", header: "Value", cell: (i: any) => i.value },
                        ]}
                        emptyMessage="No tags"
                      />
                    ) : (
                      <Box variant="small" color="text-status-inactive">No tags on this ASG.</Box>
                    )}
                  </Container>

                  {/* LB Target Groups */}
                  <Container header={<Header variant="h2" actions={<Button onClick={() => setShowAttachTGs(true)}>Attach</Button>}>
                    LB Target Groups
                  </Header>}>
                    {lbTargetGroups.data?.targetGroups?.length ? (
                      <SpaceBetween size="xs">
                        {lbTargetGroups.data.targetGroups.map((tg: any) => (
                          <Box key={tg.loadBalancerTargetGroupARN}>
                            <Box variant="small">{tg.loadBalancerTargetGroupARN}</Box>
                            <DeleteButton
                              itemName={tg.loadBalancerTargetGroupARN}
                              resourceType="target group attachment"
                              onDelete={() => detachTGs.mutateAsync({ name: selectedASG, targetGroupARNs: [tg.loadBalancerTargetGroupARN] })}
                            />
                          </Box>
                        ))}
                      </SpaceBetween>
                    ) : (
                      <Box variant="small" color="text-status-inactive">No target groups attached.</Box>
                    )}
                  </Container>

                  {/* Classic Load Balancers */}
                  <Container header={<Header variant="h2" actions={<Button onClick={() => setShowAttachLBs(true)}>Attach</Button>}>
                    Classic Load Balancers
                  </Header>}>
                    {asgLoadBalancers.data?.loadBalancers?.length ? (
                      <SpaceBetween size="xs">
                        {asgLoadBalancers.data.loadBalancers.map((lb: any) => (
                          <Box key={lb.loadBalancerName}>
                            <Box variant="small">{lb.loadBalancerName}</Box>
                            <DeleteButton
                              itemName={lb.loadBalancerName}
                              resourceType="load balancer attachment"
                              onDelete={() => detachLBs.mutateAsync({ name: selectedASG, loadBalancerNames: [lb.loadBalancerName] })}
                            />
                          </Box>
                        ))}
                      </SpaceBetween>
                    ) : (
                      <Box variant="small" color="text-status-inactive">No classic load balancers attached.</Box>
                    )}
                  </Container>

                  {/* Scaling Policies */}
                  <Container header={scalingPolicyHeader}>
                    {scalingPolicies.isLoading ? (
                      <Spinner />
                    ) : (scalingPolicies.data?.policies || []).length > 0 ? (
                      <SpaceBetween size="xs">
                        {(scalingPolicies.data?.policies || []).map((p: any) => (
                          <Box key={p.PolicyName}>
                            <Box variant="small">{p.PolicyName} ({p.PolicyType}) — {p.AdjustmentType || "N/A"}: {p.ScalingAdjustment ?? "-"}</Box>
                            <DeleteButton
                              itemName={p.PolicyName}
                              resourceType="scaling policy"
                              onDelete={() => deletePolicy.mutateAsync({ name: selectedASG, policyName: p.PolicyName })}
                              loading={deletePolicy.isPending}
                            />
                          </Box>
                        ))}
                      </SpaceBetween>
                    ) : (
                      <Box variant="small" color="text-status-inactive">No scaling policies found.</Box>
                    )}
                  </Container>

                  {/* Lifecycle Hooks */}
                  <Container header={lifecycleHooksHeader}>
                    {lifecycleHooks.isLoading ? (
                      <Spinner />
                    ) : (lifecycleHooks.data?.lifecycleHooks || []).length > 0 ? (
                      <SpaceBetween size="xs">
                        {(lifecycleHooks.data?.lifecycleHooks || []).map((h: any) => (
                          <Box key={h.LifecycleHookName}>
                            <Box variant="small">{h.LifecycleHookName} — {h.LifecycleTransition} (default: {h.DefaultResult})</Box>
                            <DeleteButton
                              itemName={h.LifecycleHookName}
                              resourceType="lifecycle hook"
                              onDelete={() => deleteHook.mutateAsync({ name: selectedASG, lifecycleHookName: h.LifecycleHookName })}
                              loading={deleteHook.isPending}
                            />
                          </Box>
                        ))}
                      </SpaceBetween>
                    ) : (
                      <Box variant="small" color="text-status-inactive">No lifecycle hooks found.</Box>
                    )}
                  </Container>
                </SpaceBetween>
              )}

              {/* Describe Types */}
              <Container header={<Header variant="h2">Describe Types & Account Limits</Header>}>
                <SpaceBetween size="m">
                  {/* Account Limits */}
                  <Box variant="h3">Account Limits</Box>
                  {accountLimits.isLoading ? (
                    <Spinner />
                  ) : accountLimits.data ? (
                    <SpaceBetween size="xs">
                      <Box variant="small">Max ASGs: {accountLimits.data.maxNumberOfAutoScalingGroups ?? "-"}</Box>
                      <Box variant="small">Max Launch Configs: {accountLimits.data.maxNumberOfLaunchConfigurations ?? "-"}</Box>
                      <Box variant="small">Current ASGs: {accountLimits.data.numberOfAutoScalingGroups ?? "-"}</Box>
                      <Box variant="small">Current Launch Configs: {accountLimits.data.numberOfLaunchConfigurations ?? "-"}</Box>
                    </SpaceBetween>
                  ) : (
                    <Box variant="small" color="text-status-inactive">Failed to load account limits.</Box>
                  )}

                  <Box variant="h3">Notification Types</Box>
                  {notificationTypes.isLoading ? (
                    <Spinner />
                  ) : (
                    <Box variant="small">{(notificationTypes.data?.notificationTypes || []).join(", ") || "No notification types found."}</Box>
                  )}

                  <Box variant="h3">Termination Policy Types</Box>
                  {terminationPolicyTypes.isLoading ? (
                    <Spinner />
                  ) : (
                    <Box variant="small">{(terminationPolicyTypes.data?.terminationPolicyTypes || []).join(", ") || "No termination policy types found."}</Box>
                  )}

                  <Box variant="h3">Adjustment Types</Box>
                  {adjustmentTypes.isLoading ? (
                    <Spinner />
                  ) : (
                    <Box variant="small">{(adjustmentTypes.data?.adjustmentTypes || []).join(", ") || "No adjustment types found."}</Box>
                  )}

                  <Box variant="h3">Lifecycle Hook Types</Box>
                  {lifecycleHookTypes.isLoading ? (
                    <Spinner />
                  ) : (
                    <Box variant="small">{(lifecycleHookTypes.data?.lifecycleHookTypes || []).join(", ") || "No lifecycle hook types found."}</Box>
                  )}

                  <Box variant="h3">Metric Collection Types</Box>
                  {metricCollectionTypes.isLoading ? (
                    <Spinner />
                  ) : (
                    <SpaceBetween size="xs">
                      {(metricCollectionTypes.data?.metricCollectionTypes || []).length > 0 ? (
                        (metricCollectionTypes.data?.metricCollectionTypes || []).map((m: any) => (
                          <Box key={m.metric} variant="small">
                            {m.metric} ({m.granularities?.join(", ") || "No granularities"})
                          </Box>
                        ))
                      ) : (
                        <Box variant="small" color="text-status-inactive">No metric collection types found.</Box>
                      )}
                    </SpaceBetween>
                  )}
                </SpaceBetween>
              </Container>

              {/* Modals */}
              {showStartRefresh && (
                <Modal visible onDismiss={() => setShowStartRefresh(false)} header="Start Instance Refresh" size="small" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowStartRefresh(false)}>Cancel</Button>
                    <Button variant="primary" loading={startRefresh.isPending} onClick={() => {
                      if (selectedASG) startRefresh.mutate({ name: selectedASG, minHealthyPercentage: Number(minHealthy) || 90 }, { onSuccess: () => setShowStartRefresh(false) });
                    }}>Start</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Min Healthy %" description="Minimum percentage of instances to keep healthy">
                    <Input value={minHealthy} onChange={({ detail }) => setMinHealthy(detail.value)} placeholder="90" type="number" />
                  </FormField>
                </Modal>
              )}
              {showAddTag && (
                <Modal visible onDismiss={() => setShowAddTag(false)} header="Add Tag" size="small" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowAddTag(false)}>Cancel</Button>
                    <Button variant="primary" loading={createOrUpdateTags.isPending} onClick={() => {
                      if (selectedASG && tagKey.trim() && tagValue.trim()) {
                        createOrUpdateTags.mutate({ name: selectedASG, tags: [{ key: tagKey.trim(), value: tagValue.trim() }] }, { onSuccess: () => { setShowAddTag(false); setTagKey(""); setTagValue(""); } });
                      }
                    }} disabled={!tagKey.trim() || !tagValue.trim()}>Add</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Key"><Input value={tagKey} onChange={({ detail }) => setTagKey(detail.value)} placeholder="env" /></FormField>
                  <FormField label="Value"><Input value={tagValue} onChange={({ detail }) => setTagValue(detail.value)} placeholder="production" /></FormField>
                </Modal>
              )}
              {showAttachTGs && (
                <Modal visible onDismiss={() => setShowAttachTGs(false)} header="Attach LB Target Groups" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowAttachTGs(false)}>Cancel</Button>
                    <Button variant="primary" loading={attachTGs.isPending} onClick={() => {
                      if (selectedASG && tgArnsList.trim()) {
                        attachTGs.mutate({ name: selectedASG, targetGroupARNs: tgArnsList.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean) }, { onSuccess: () => { setShowAttachTGs(false); setTgArnsList(""); } });
                      }
                    }} disabled={!tgArnsList.trim()}>Attach</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Target Group ARNs" description="Comma or newline separated">
                    <Textarea value={tgArnsList} onChange={({ detail }) => setTgArnsList(detail.value)} placeholder="arn:aws:elasticloadbalancing:..." rows={3} />
                  </FormField>
                </Modal>
              )}
              {showAttachLBs && (
                <Modal visible onDismiss={() => setShowAttachLBs(false)} header="Attach Classic Load Balancers" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowAttachLBs(false)}>Cancel</Button>
                    <Button variant="primary" loading={attachLBs.isPending} onClick={() => {
                      if (selectedASG && lbNamesList.trim()) {
                        attachLBs.mutate({ name: selectedASG, loadBalancerNames: lbNamesList.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean) }, { onSuccess: () => { setShowAttachLBs(false); setLbNamesList(""); } });
                      }
                    }} disabled={!lbNamesList.trim()}>Attach</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Load Balancer Names" description="Comma or newline separated">
                    <Textarea value={lbNamesList} onChange={({ detail }) => setLbNamesList(detail.value)} placeholder="my-classic-lb" rows={3} />
                  </FormField>
                </Modal>
              )}

              {/* Create Scaling Policy Modal */}
              {showCreatePolicy && (
                <Modal visible onDismiss={() => setShowCreatePolicy(false)} header="Create Scaling Policy" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowCreatePolicy(false)}>Cancel</Button>
                    <Button variant="primary" loading={createPolicy.isPending} onClick={() => {
                      if (selectedASG && policyName.trim()) {
                        createPolicy.mutate({
                          name: selectedASG,
                          policyName: policyName.trim(),
                          policyType,
                          adjustmentType,
                          scalingAdjustment: Number(scalingAdjustment) || 1,
                          cooldown: Number(policyCooldown) || 300,
                        }, { onSuccess: () => { setShowCreatePolicy(false); setPolicyName(""); } });
                      }
                    }} disabled={!policyName.trim()}>Create</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Policy Name"><Input value={policyName} onChange={({ detail }) => setPolicyName(detail.value)} placeholder="scale-up" /></FormField>
                  <FormField label="Policy Type">
                    <Select
                      selectedOption={policyType === "SimpleScaling" ? { label: "Simple Scaling", value: "SimpleScaling" } : { label: "Step Scaling", value: "StepScaling" }}
                      onChange={({ detail }) => setPolicyType(detail.selectedOption?.value || "SimpleScaling")}
                      options={[{ label: "Simple Scaling", value: "SimpleScaling" }, { label: "Step Scaling", value: "StepScaling" }]}
                    />
                  </FormField>
                  <FormField label="Adjustment Type">
                    <Select
                      selectedOption={{ label: adjustmentType, value: adjustmentType }}
                      onChange={({ detail }) => setAdjustmentType(detail.selectedOption?.value || "ChangeInCapacity")}
                      options={[
                        { label: "ChangeInCapacity", value: "ChangeInCapacity" },
                        { label: "ExactCapacity", value: "ExactCapacity" },
                        { label: "PercentChangeInCapacity", value: "PercentChangeInCapacity" },
                      ]}
                    />
                  </FormField>
                  <FormField label="Scaling Adjustment"><Input value={scalingAdjustment} onChange={({ detail }) => setScalingAdjustment(detail.value)} type="number" placeholder="1" /></FormField>
                  <FormField label="Cooldown (seconds)"><Input value={policyCooldown} onChange={({ detail }) => setPolicyCooldown(detail.value)} type="number" placeholder="300" /></FormField>
                </Modal>
              )}

              {/* Create Lifecycle Hook Modal */}
              {showCreateHook && (
                <Modal visible onDismiss={() => setShowCreateHook(false)} header="Create Lifecycle Hook" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowCreateHook(false)}>Cancel</Button>
                    <Button variant="primary" loading={putHook.isPending} onClick={() => {
                      if (selectedASG && hookName.trim() && hookTransition.trim()) {
                        putHook.mutate({
                          name: selectedASG,
                          lifecycleHookName: hookName.trim(),
                          lifecycleTransition: hookTransition,
                          notificationTargetARN: hookTargetARN.trim() || undefined,
                          roleARN: hookRoleARN.trim() || undefined,
                          defaultResult: hookResult,
                        }, { onSuccess: () => { setShowCreateHook(false); setHookName(""); } });
                      }
                    }} disabled={!hookName.trim()}>Create</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Hook Name"><Input value={hookName} onChange={({ detail }) => setHookName(detail.value)} placeholder="my-hook" /></FormField>
                  <FormField label="Lifecycle Transition">
                    <Select
                      selectedOption={{ label: hookTransition, value: hookTransition }}
                      onChange={({ detail }) => setHookTransition(detail.selectedOption?.value || "autoscaling:EC2_INSTANCE_LAUNCHING")}
                      options={[
                        { label: "autoscaling:EC2_INSTANCE_LAUNCHING", value: "autoscaling:EC2_INSTANCE_LAUNCHING" },
                        { label: "autoscaling:EC2_INSTANCE_TERMINATING", value: "autoscaling:EC2_INSTANCE_TERMINATING" },
                      ]}
                    />
                  </FormField>
                  <FormField label="Default Result">
                    <Select
                      selectedOption={{ label: hookResult, value: hookResult }}
                      onChange={({ detail }) => setHookResult(detail.selectedOption?.value || "ABANDON")}
                      options={[
                        { label: "ABANDON", value: "ABANDON" },
                        { label: "CONTINUE", value: "CONTINUE" },
                      ]}
                    />
                  </FormField>
                  <FormField label="Notification Target ARN (optional)"><Input value={hookTargetARN} onChange={({ detail }) => setHookTargetARN(detail.value)} placeholder="arn:aws:sns:..." /></FormField>
                  <FormField label="Role ARN (optional)"><Input value={hookRoleARN} onChange={({ detail }) => setHookRoleARN(detail.value)} placeholder="arn:aws:iam:..." /></FormField>
                </Modal>
              )}

              {/* Complete Lifecycle Action Modal */}
              {showCompleteAction && (
                <Modal visible onDismiss={() => setShowCompleteAction(false)} header="Complete Lifecycle Action" size="small" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowCompleteAction(false)}>Cancel</Button>
                    <Button variant="primary" loading={completeAction.isPending} onClick={() => {
                      if (selectedASG && completeHookName.trim()) {
                        completeAction.mutate({
                          name: selectedASG,
                          lifecycleHookName: completeHookName.trim(),
                          lifecycleActionResult: completeActionResult,
                        }, { onSuccess: () => { setShowCompleteAction(false); setCompleteHookName(""); } });
                      }
                    }} disabled={!completeHookName.trim()}>Complete</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Lifecycle Hook Name"><Input value={completeHookName} onChange={({ detail }) => setCompleteHookName(detail.value)} placeholder="my-hook" /></FormField>
                  <FormField label="Action Result">
                    <Select
                      selectedOption={{ label: completeActionResult, value: completeActionResult }}
                      onChange={({ detail }) => setCompleteActionResult(detail.selectedOption?.value || "CONTINUE")}
                      options={[
                        { label: "CONTINUE", value: "CONTINUE" },
                        { label: "ABANDON", value: "ABANDON" },
                      ]}
                    />
                  </FormField>
                </Modal>
              )}
            </SpaceBetween>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  CloudFront
// ────────────────────────────────────────────────────────

