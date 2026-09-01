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
  Divider,
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
  useStateMachineVersions,
  usePublishStateMachineVersion,
  useUpdateStateMachine,
  useDeleteStateMachineVersion,
  useStartExecution,
  useStopExecution,
  useCreateActivity,
  useDeleteActivity,
  useGetActivityTask,
  useSendTaskSuccess,
  useSendTaskFailure,
  useSendTaskHeartbeat,
  useStartSyncExecution,
  useValidateStateMachineDefinition,
  useStateMachineTags,
  useTagStateMachine,
  useUntagStateMachine,
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

export function StepFunctionsDashboard() {
  const { data: smData, isLoading } = useStateMachines();
  const deleteSm = useDeleteStateMachine();
  const [selectedSm, setSelectedSm] = useState<string | null>(null);
  const [versionSm, setVersionSm] = useState<string | null>(null);
  const { data: execData } = useStateMachineExecutions(selectedSm);
  const { data: actData } = useActivities();
  const { data: versionsData } = useStateMachineVersions(versionSm);
  const publishVersion = usePublishStateMachineVersion();
  const [editArn, setEditArn] = useState<string | null>(null);
  const [editDefinition, setEditDefinition] = useState("");
  const [editRoleArn, setEditRoleArn] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const updateSm = useUpdateStateMachine(editArn ?? "");
/* istanbul ignore next */
  const deleteVersion = useDeleteStateMachineVersion();
  const startExecution = useStartExecution();
  const stopExecution = useStopExecution();
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startName, setStartName] = useState("");
  const [startInput, setStartInput] = useState("{}");
  const [startError, setStartError] = useState<string | null>(null);
  // G.84 — activities, task callbacks, sync runs, validation, tags
  const createActivity = useCreateActivity();
  const deleteActivity = useDeleteActivity();
  const getActivityTask = useGetActivityTask();
  const sendTaskSuccess = useSendTaskSuccess();
  const sendTaskFailure = useSendTaskFailure();
  const sendTaskHeartbeat = useSendTaskHeartbeat();
  const startSyncExecution = useStartSyncExecution();
  const validateDefinition = useValidateStateMachineDefinition();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [taskAct, setTaskAct] = useState<string | null>(null);
  const [taskWorker, setTaskWorker] = useState("");
  const [taskData, setTaskData] = useState<any>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskOutput, setTaskOutput] = useState("{}");
  const [taskFailError, setTaskFailError] = useState("");
  const [taskFailCause, setTaskFailCause] = useState("");
  const [tagsArn, setTagsArn] = useState<string | null>(null);
  const { data: tagsData } = useStateMachineTags(tagsArn);
  const tagStateMachine = useTagStateMachine(tagsArn || "");
  const untagStateMachine = useUntagStateMachine(tagsArn || "");
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [syncArn, setSyncArn] = useState<string | null>(null);
  const [syncName, setSyncName] = useState("");
  const [syncInput, setSyncInput] = useState("{}");
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [validateOpen, setValidateOpen] = useState(false);
  const [validateDef, setValidateDef] = useState("");
  const [validateResult, setValidateResult] = useState<any>(null);
  const [validateError, setValidateError] = useState<string | null>(null);

  if (isLoading) return <TableSkeleton />;

  if (selectedSm) {
    const isRunning = (status?: string) => status === "RUNNING";
    const submitStart = async () => {
      setStartError(null);
      try {
        await startExecution.mutateAsync({
          arn: selectedSm,
          name: startName.trim() || undefined,
          input: startInput.trim() || undefined,
        });
        setStartModalOpen(false);
        setStartName("");
        setStartInput("{}");
      } catch (e: any) {
        setStartError(e?.message || "Failed to start execution");
      }
    };
    return (
      <>
        <Box margin={{ bottom: "s" }}>
          <Button iconName="arrow-left" onClick={() => setSelectedSm(null)}>
            Back to state machines
          </Button>
        </Box>
        <ResourceTable
          resourceName="Execution"
          headerTitle="Executions"
          headerCounter={execData?.total}
          headerActions={
            <Button variant="primary" iconName="add-plus" onClick={() => setStartModalOpen(true)}>
              Start execution
            </Button>
          }
          items={(execData?.executions || []).map((e: any) => ({
            name: e.name,
            executionArn: e.executionArn,
            status: e.status,
            started: e.startDate ? new Date(e.startDate).toLocaleString() : "-",
            stopped: e.stopDate ? new Date(e.stopDate).toLocaleString() : "-",
          }))}
          loading={false}
          emptyMessage="No executions"
          columns={[
            { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
            { id: "status", header: "Status", cell: (i: any) => i.status },
            { id: "started", header: "Started", cell: (i: any) => i.started },
            { id: "stopped", header: "Stopped", cell: (i: any) => i.stopped },
            {
              id: "actions",
              header: "",
              cell: (i: any) =>
                isRunning(i.status) ? (
                  <Button
                    iconName="close"
                    loading={stopExecution.isPending && stopExecution.variables?.executionArn === i.executionArn}
                    onClick={() =>
                      stopExecution.mutateAsync({
                        executionArn: i.executionArn,
                        stateMachineArn: selectedSm,
                      })
                    }
                  >
                    Stop
                  </Button>
                ) : null,
            },
          ]}
          filterEnabled
          filterPlaceholder="Find executions"
          filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        />
        <Modal
          visible={startModalOpen}
          onDismiss={() => setStartModalOpen(false)}
          header="Start execution"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setStartModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" loading={startExecution.isPending} onClick={submitStart}>
                  Start
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            <SpaceBetween size="m">
              {startError && <Alert type="error">{startError}</Alert>}
              <FormField label="Name" description="Optional. A unique name for this execution.">
                <Input value={startName} onChange={(e) => setStartName(e.detail.value)} placeholder="my-execution" />
              </FormField>
              <FormField label="Input" description="JSON input passed to the state machine.">
                <Textarea value={startInput} onChange={(e) => setStartInput(e.detail.value)} rows={6} />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </>
    );
  }

  return (
    <>
    <Tabs
      tabs={[
        {
          id: "state-machines",
          label: "State Machines",
          content: (
            <ResourceTable
              resourceName="State Machine"
              headerTitle="Step Functions State Machines"
              headerCounter={smData?.total}
              headerActions={
                <Button variant="primary" iconName="script" onClick={() => setValidateOpen(true)}>
                  Validate definition
                </Button>
              }
              items={(smData?.stateMachines || []).map((sm: any) => ({
                arn: sm.stateMachineArn,
                name: sm.name,
                type: sm.type || "STANDARD",
                created: sm.creationDate ? new Date(sm.creationDate).toLocaleDateString() : "-",
              }))}
              loading={false}
              emptyMessage="No state machines"
              columns={[
                {
                  id: "name",
                  header: "Name",
                  cell: (i: any) => (
                    <Button variant="link" onClick={() => setSelectedSm(i.arn)}>
                      {i.name}
                    </Button>
                  ),
                  isRowHeader: true,
                },
                { id: "type", header: "Type", cell: (i: any) => i.type },
                { id: "created", header: "Created", cell: (i: any) => i.created },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => { setEditArn(i.arn); setEditDefinition(""); setEditRoleArn(""); setEditError(null); }}>
                        Edit
                      </Button>
                      <Button variant="link" onClick={() => setTagsArn(i.arn)}>
                        Tags
                      </Button>
                      <Button variant="link" onClick={() => { setSyncArn(i.arn); setSyncName(""); setSyncInput("{}"); setSyncResult(null); setSyncError(null); }}>
                        Sync run
                      </Button>
                      <DeleteButton
                        itemName={i.name}
                        resourceType="state machine"
                        loading={deleteSm.isPending && deleteSm.variables === i.arn}
                        onDelete={() => deleteSm.mutateAsync(i.arn)}
                      />
                    </SpaceBetween>
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find state machines"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "activities",
          label: "Activities",
          content: (
            <ResourceTable
              resourceName="Activity"
              headerTitle="Activities"
              headerCounter={actData?.total}
              headerActions={
                <Button variant="primary" iconName="add-plus" onClick={() => { setCreateOpen(true); setCreateName(""); setCreateError(null); }}>
                  Create activity
                </Button>
              }
              items={(actData?.activities || []).map((a: any) => ({
                arn: a.activityArn,
                name: a.name,
                created: a.creationDate ? new Date(a.creationDate).toLocaleDateString() : "-",
              }))}
              loading={false}
              emptyMessage="No activities"
              columns={[
                { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "arn", header: "ARN", cell: (i: any) => i.arn },
                { id: "created", header: "Created", cell: (i: any) => i.created },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        variant="link"
                        onClick={() => {
                          setTaskAct(i.arn);
                          setTaskWorker("");
                          setTaskData(null);
                          setTaskError(null);
                          setTaskOutput("{}");
                          setTaskFailError("");
                          setTaskFailCause("");
                        }}
                      >
                        Task callbacks
                      </Button>
                      <DeleteButton
                        itemName={i.name}
                        resourceType="activity"
                        loading={deleteActivity.isPending && deleteActivity.variables === i.arn}
                        onDelete={() => deleteActivity.mutateAsync(i.arn)}
                      />
                    </SpaceBetween>
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find activities"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "versions",
          label: "Versions",
          content: (
            <>
              <Box margin={{ bottom: "s" }}>
                <SpaceBetween direction="horizontal" size="s">
                  <Select
                    selectedOption={versionSm ? { value: versionSm } : null}
                    onChange={({ detail }) => setVersionSm(detail.selectedOption!.value!)}
                    options={(smData?.stateMachines || []).map((sm: any) => ({
                      value: sm.stateMachineArn,
                      label: sm.name,
                    }))}
                    placeholder="Choose a state machine"
                    selectedAriaLabel="Selected"
                  />
                  <Button
                    iconName="add-plus"
                    variant="primary"
                    loading={publishVersion.isPending}
                    onClick={() => publishVersion.mutateAsync(versionSm!)}
                    disabled={!versionSm}
                  >
                    Publish Version
                  </Button>
                </SpaceBetween>
              </Box>
              <ResourceTable
                resourceName="Version"
                headerTitle="State Machine Versions"
                headerCounter={versionsData?.total}
                items={(versionsData?.versions || []).map((v: any) => ({
                  arn: v.stateMachineVersionArn,
                  revision: v.stateMachineVersionArn?.split(":").pop() || "-",
                  created: v.creationDate ? new Date(v.creationDate).toLocaleString() : "-",
                }))}
                loading={false}
                                emptyMessage={versionSm ? "No versions published yet" : "Select a state machine to view versions"}
                columns={[
                  {
                    id: "revision",
                    header: "Revision",
                    cell: (i: any) => i.revision,
                    isRowHeader: true,
                  },
                  { id: "arn", header: "Version ARN", cell: (i: any) => i.arn },
                  { id: "created", header: "Published", cell: (i: any) => i.created },
                  {
                    id: "actions",
                    header: "",
                    cell: (i: any) => (
                      <DeleteButton
                        itemName={i.revision}
                        resourceType="version"
                        loading={deleteVersion.isPending && deleteVersion.variables?.versionArn === i.arn}
                        onDelete={() =>
                          deleteVersion.mutateAsync({
                            arn: versionSm!,
                            versionArn: i.arn,
                          })
                        }
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find versions"
                filterFunction={(i: any, s: string) => i.arn?.toLowerCase().includes(s.toLowerCase())}
              />
            </>
          ),
        },
      ]}
    />

    {/* G.84 — Create activity modal */}
    <Modal
      visible={createOpen}
      onDismiss={() => setCreateOpen(false)}
      header="Create activity"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              iconName="add-plus"
              disabled={!createName.trim()}
              loading={createActivity.isPending}
              onClick={async () => {
                setCreateError(null);
                try {
                  await createActivity.mutateAsync(createName.trim());
                  setCreateOpen(false);
                  setCreateName("");
                } catch (e: any) {
                  setCreateError(e?.message || "Failed to create activity");
                }
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
          {createError && <Alert type="error">{createError}</Alert>}
          <FormField label="Activity name">
            <Input value={createName} onChange={(e) => setCreateName(e.detail.value)} placeholder="my-activity" />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>

    {/* G.84 — Task callbacks modal */}
    <Modal
      visible={!!taskAct}
      onDismiss={() => setTaskAct(null)}
      header={`Task callbacks: ${taskAct || ""}`}
      size="large"
      footer={
        <Box float="right">
          <Button variant="link" onClick={() => setTaskAct(null)}>
            Close
          </Button>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {taskError && <Alert type="error">{taskError}</Alert>}
        <SpaceBetween direction="horizontal" size="xs">
          <Input
            value={taskWorker}
            onChange={(e) => setTaskWorker(e.detail.value)}
            placeholder="Worker name"
            disabled={!!taskData}
          />
          <Button
            variant="primary"
            disabled={!taskWorker.trim()}
            loading={getActivityTask.isPending}
            onClick={async () => {
              setTaskError(null);
              try {
                const res: any = await getActivityTask.mutateAsync({ arn: taskAct!, workerName: taskWorker.trim() });
                setTaskData(res.task || null);
              } catch (e: any) {
                setTaskError(e?.message || "Failed to get activity task");
              }
            }}
          >
            Poll for task
          </Button>
        </SpaceBetween>
        {taskData ? (
          <Container header={<Header variant="h3">Task</Header>}>
            <SpaceBetween size="s">
              <div>
                <b>Task token:</b> {taskData.taskToken || "—"}
              </div>
              <div>
                <b>Input:</b> <Box>{taskData.input || "{}"}</Box>
              </div>
              <Divider />
              <SpaceBetween direction="horizontal" size="xs">
                <Input value={taskOutput} onChange={(e) => setTaskOutput(e.detail.value)} placeholder='{"result": "ok"}' />
                <Button
                  variant="primary"
                  loading={sendTaskSuccess.isPending}
                  onClick={async () => {
                    setTaskError(null);
                    try {
                      await sendTaskSuccess.mutateAsync({ arn: taskAct!, taskToken: taskData.taskToken, output: taskOutput });
                      setTaskData(null);
                      setTaskWorker("");
                    } catch (e: any) {
                      setTaskError(e?.message || "Failed to send task success");
                    }
                  }}
                >
                  Send success
                </Button>
              </SpaceBetween>
              <SpaceBetween direction="horizontal" size="xs">
                <Input value={taskFailError} onChange={(e) => setTaskFailError(e.detail.value)} placeholder="Error name" />
                <Input value={taskFailCause} onChange={(e) => setTaskFailCause(e.detail.value)} placeholder="Cause" />
                <Button
                  variant="normal"
                  loading={sendTaskFailure.isPending}
                  onClick={async () => {
                    setTaskError(null);
                    try {
                      await sendTaskFailure.mutateAsync({
                        arn: taskAct!,
                        taskToken: taskData.taskToken,
                        error: taskFailError.trim() || undefined,
                        cause: taskFailCause.trim() || undefined,
                      });
                      setTaskData(null);
                      setTaskWorker("");
                    } catch (e: any) {
                      setTaskError(e?.message || "Failed to send task failure");
                    }
                  }}
                >
                  Send failure
                </Button>
                <Button
                  variant="normal"
                  loading={sendTaskHeartbeat.isPending}
                  onClick={async () => {
                    setTaskError(null);
                    try {
                      await sendTaskHeartbeat.mutateAsync({ arn: taskAct!, taskToken: taskData.taskToken });
                    } catch (e: any) {
                      setTaskError(e?.message || "Failed to send heartbeat");
                    }
                  }}
                >
                  Heartbeat
                </Button>
              </SpaceBetween>
            </SpaceBetween>
          </Container>
        ) : (
          <Box color="text-body-secondary">No task fetched yet. Poll with a worker name to receive a task.</Box>
        )}
      </SpaceBetween>
    </Modal>

    {/* G.84 — Tags modal */}
    <Modal
      visible={!!tagsArn}
      onDismiss={() => setTagsArn(null)}
      header={`Tags for state machine`}
    >
      <SpaceBetween size="s">
        {(tagsData || []).length === 0 ? (
          <Box color="text-body-secondary">No tags found.</Box>
        ) : (
          <SpaceBetween size="xs">
            {tagsData?.map((t: any) => (
              <SpaceBetween key={t.key} direction="horizontal" size="xs">
                <Box variant="small">
                  <b>{t.key}:</b> {t.value}
                </Box>
                <Button
                  variant="link"
                  onClick={() => untagStateMachine.mutateAsync([t.key])}
                >
                  Remove
                </Button>
              </SpaceBetween>
            ))}
          </SpaceBetween>
        )}
        <SpaceBetween direction="horizontal" size="xs">
          <Input placeholder="Key" value={newTagKey} onChange={(e) => setNewTagKey(e.detail.value)} />
          <Input placeholder="Value" value={newTagValue} onChange={(e) => setNewTagValue(e.detail.value)} />
          <Button
            variant="primary"
            disabled={!newTagKey.trim()}
            loading={tagStateMachine.isPending}
            onClick={async () => {
              try {
                await tagStateMachine.mutateAsync([{ key: newTagKey.trim(), value: newTagValue }]);
                setNewTagKey("");
                setNewTagValue("");
              } catch {
                // tag errors surface via query refetch failure only
              }
            }}
          >
            Add tag
          </Button>
        </SpaceBetween>
        <Button variant="link" onClick={() => setTagsArn(null)}>
          Close
        </Button>
      </SpaceBetween>
    </Modal>

    {/* G.84 — Sync run modal */}
    <Modal
      visible={!!syncArn}
      onDismiss={() => setSyncArn(null)}
      header={`Sync run: ${syncArn || ""}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setSyncArn(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={startSyncExecution.isPending}
              onClick={async () => {
                setSyncError(null);
                setSyncResult(null);
                try {
                  const res: any = await startSyncExecution.mutateAsync({
                    arn: syncArn!,
                    name: syncName.trim() || undefined,
                    input: syncInput.trim() || undefined,
                  });
                  setSyncResult(res.execution || null);
                } catch (e: any) {
                  setSyncError(e?.message || "Failed to run sync execution");
                }
              }}
            >
              Run
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="m">
          {syncError && <Alert type="error">{syncError}</Alert>}
          {syncResult && (
            <Alert type="success">
              <b>Status:</b> {syncResult.status || "—"} — <b>Execution ARN:</b> {syncResult.executionArn || "—"}
            </Alert>
          )}
          <FormField label="Name" description="Optional execution name.">
            <Input value={syncName} onChange={(e) => setSyncName(e.detail.value)} placeholder="my-sync-run" />
          </FormField>
          <FormField label="Input" description="JSON input passed to the state machine.">
            <Textarea value={syncInput} onChange={(e) => setSyncInput(e.detail.value)} rows={6} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>

    {/* Edit state machine modal */}
    <Modal
      visible={!!editArn}
      onDismiss={() => setEditArn(null)}
      header={`Edit state machine — ${editArn?.split(":").pop() ?? ""}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setEditArn(null)}>Cancel</Button>
            <Button
              variant="primary"
              loading={updateSm.isPending}
              disabled={!editDefinition.trim() && !editRoleArn.trim()}
              onClick={async () => {
                setEditError(null);
                try {
                  await updateSm.mutateAsync({
                    definition: editDefinition.trim() || undefined,
                    roleArn: editRoleArn.trim() || undefined,
                  });
                  setEditArn(null);
                } catch (e) {
                  setEditError((e as Error)?.message || "Failed to update state machine");
                }
              }}
            >
              Save changes
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {editError && <Alert type="error">{editError}</Alert>}
        <FormField label="New definition (JSON) — optional" description="Leave empty to keep the current definition">
          <Textarea
            value={editDefinition}
            onChange={({ detail }) => setEditDefinition(detail.value)}
            rows={8}
            placeholder='{ "StartAt": "S", "States": {} }'
          />
        </FormField>
        <FormField label="New role ARN — optional">
          <Input
            value={editRoleArn}
            onChange={({ detail }) => setEditRoleArn(detail.value)}
            placeholder="arn:aws:iam::123456789012:role/execution-role"
          />
        </FormField>
      </SpaceBetween>
    </Modal>

    {/* G.84 — Validate definition modal */}
    <Modal
      visible={validateOpen}
      onDismiss={() => setValidateOpen(false)}
      header="Validate state machine definition"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setValidateOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              disabled={!validateDef.trim()}
              loading={validateDefinition.isPending}
              onClick={async () => {
                setValidateError(null);
                setValidateResult(null);
                try {
                  const res: any = await validateDefinition.mutateAsync({ definition: validateDef });
                  setValidateResult(res);
                } catch (e: any) {
                  setValidateError(e?.message || "Failed to validate definition");
                }
              }}
            >
              Validate
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="m">
          {validateError && <Alert type="error">{validateError}</Alert>}
          {validateResult && (
            <Alert type={validateResult.valid ? "success" : "error"}>
              {validateResult.valid
                ? "Definition is valid."
                : (validateResult.errors || []).length > 0
                  ? validateResult.errors.map((d: any) => `${d.code || ""} ${d.message || ""}`).join("; ")
                  : "Definition is invalid."}
            </Alert>
          )}
          <FormField label="Definition" description="Amazon States Language JSON definition.">
            <Textarea value={validateDef} onChange={(e) => setValidateDef(e.detail.value)} rows={10} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  </>
  );
}

// ────────────────────────────────────────────────────────
//  OpenSearch
// ────────────────────────────────────────────────────────

