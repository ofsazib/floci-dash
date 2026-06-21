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

export function BatchDashboard() {
  const { data: ceData, isLoading: ceLoading } = useBatchComputeEnvironments();
  const { data: jqData, isLoading: jqLoading } = useBatchJobQueues();
  const { data: jdData, isLoading: jdLoading } = useBatchJobDefinitions();
  const createCE = useCreateBatchComputeEnvironment();
  const deleteCE = useDeleteBatchComputeEnvironment();
  const createJQ = useCreateBatchJobQueue();
  const deleteJQ = useDeleteBatchJobQueue();
  const registerJD = useRegisterBatchJobDefinition();
  const deregisterJD = useDeregisterBatchJobDefinition();
  const submitJob = useSubmitBatchJob();
  const [showCreateCE, setShowCreateCE] = useState(false);
  const [ceName, setCeName] = useState("");
  const [ceType, setCeType] = useState("MANAGED");
  const [showCreateJQ, setShowCreateJQ] = useState(false);
  const [jqName, setJqName] = useState("");
  const [jqPriority, setJqPriority] = useState("");
  const [showCreateJD, setShowCreateJD] = useState(false);
  const [jdName, setJdName] = useState("");
  const [showSubmitJob, setShowSubmitJob] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobQueue, setJobQueue] = useState("");
  const [jobDefinition, setJobDefinition] = useState("");

  if (ceLoading || jqLoading || jdLoading) return <TableSkeleton />;

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Compute Environment"
        headerTitle="Compute Environments"
        headerCounter={(ceData?.computeEnvironments || []).length}
        items={(ceData?.computeEnvironments || []).map((ce: any) => ({
          name: ce.computeEnvironmentName,
          type: ce.type || "-",
          state: ce.state || "-",
          status: ce.status || "-",
        }))}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "type", header: "Type", cell: (i: any) => i.type },
          { id: "state", header: "State", cell: (i: any) => i.state },
          { id: "status", header: "Status", cell: (i: any) => i.status },
          { id: "actions", header: "", cell: (i: any) => (
            <DeleteButton itemName={i.name} resourceType="compute environment" loading={deleteCE.isPending && deleteCE.variables === i.name} onDelete={() => deleteCE.mutateAsync(i.name)} />
          )},
        ]}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreateCE(true)}
      />

      <ResourceTable
        resourceName="Job Queue"
        headerTitle="Job Queues"
        headerCounter={(jqData?.jobQueues || []).length}
        items={(jqData?.jobQueues || []).map((jq: any) => ({
          name: jq.jobQueueName,
          priority: jq.priority,
          state: jq.state || "-",
          status: jq.status || "-",
        }))}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "priority", header: "Priority", cell: (i: any) => i.priority },
          { id: "state", header: "State", cell: (i: any) => i.state },
          { id: "status", header: "Status", cell: (i: any) => i.status },
          { id: "actions", header: "", cell: (i: any) => (
            <DeleteButton itemName={i.name} resourceType="job queue" loading={deleteJQ.isPending && deleteJQ.variables === i.name} onDelete={() => deleteJQ.mutateAsync(i.name)} />
          )},
        ]}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreateJQ(true)}
      />

      <ResourceTable
        resourceName="Job Definition"
        headerTitle="Job Definitions"
        headerCounter={(jdData?.jobDefinitions || []).length}
        items={(jdData?.jobDefinitions || []).map((jd: any) => ({
          name: jd.jobDefinitionName,
          revision: jd.revision,
          type: jd.type || "-",
          status: jd.status || "-",
        }))}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "revision", header: "Revision", cell: (i: any) => i.revision },
          { id: "type", header: "Type", cell: (i: any) => i.type },
          { id: "status", header: "Status", cell: (i: any) => i.status },
          { id: "actions", header: "", cell: (i: any) => (
            <DeleteButton itemName={i.name} resourceType="job definition" loading={deregisterJD.isPending && deregisterJD.variables === i.name} onDelete={() => deregisterJD.mutateAsync(i.name)} />
          )},
        ]}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreateJD(true)}
      />

      <Modal visible={showCreateCE} onDismiss={() => setShowCreateCE(false)} header="Create Compute Environment"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreateCE(false)}>Cancel</Button>
          <Button variant="primary" loading={createCE.isPending} disabled={!ceName.trim()} onClick={() => {
            createCE.mutate({ computeEnvironmentName: ceName.trim(), type: ceType }, { onSuccess: () => { setShowCreateCE(false); setCeName(""); } });
          }}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          {createCE.isError && <Alert type="error" dismissible>{(createCE.error as Error)?.message || "Failed"}</Alert>}
          <SpaceBetween size="m">
            <FormField label="Name"><Input value={ceName} onChange={({ detail }) => setCeName(detail.value)} /></FormField>
            <FormField label="Type">
              <Select selectedOption={{ label: ceType, value: ceType }} onChange={({ detail }) => setCeType(detail.selectedOption.value || "MANAGED")} options={[{ label: "MANAGED", value: "MANAGED" }, { label: "UNMANAGED", value: "UNMANAGED" }]} />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showCreateJQ} onDismiss={() => setShowCreateJQ(false)} header="Create Job Queue"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreateJQ(false)}>Cancel</Button>
          <Button variant="primary" loading={createJQ.isPending} disabled={!jqName.trim() || !jqPriority.trim()} onClick={() => {
            createJQ.mutate({ jobQueueName: jqName.trim(), priority: parseInt(jqPriority) }, { onSuccess: () => { setShowCreateJQ(false); setJqName(""); setJqPriority(""); } });
          }}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          {createJQ.isError && <Alert type="error" dismissible>{(createJQ.error as Error)?.message || "Failed"}</Alert>}
          <SpaceBetween size="m">
            <FormField label="Queue name"><Input value={jqName} onChange={({ detail }) => setJqName(detail.value)} /></FormField>
            <FormField label="Priority"><Input type="number" value={jqPriority} onChange={({ detail }) => setJqPriority(detail.value)} /></FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showCreateJD} onDismiss={() => setShowCreateJD(false)} header="Register Job Definition"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreateJD(false)}>Cancel</Button>
          <Button variant="primary" loading={registerJD.isPending} disabled={!jdName.trim()} onClick={() => {
            registerJD.mutate({ jobDefinitionName: jdName.trim(), type: "container", containerProperties: { image: "busybox:latest", command: ["echo", "hello"] } }, { onSuccess: () => { setShowCreateJD(false); setJdName(""); } });
          }}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          {registerJD.isError && <Alert type="error" dismissible>{(registerJD.error as Error)?.message || "Failed"}</Alert>}
          <FormField label="Definition name"><Input value={jdName} onChange={({ detail }) => setJdName(detail.value)} /></FormField>
        </Form>
      </Modal>

      <Modal visible={showSubmitJob} onDismiss={() => setShowSubmitJob(false)} header="Submit Job"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowSubmitJob(false)}>Cancel</Button>
          <Button variant="primary" loading={submitJob.isPending} disabled={!jobName.trim() || !jobQueue.trim() || !jobDefinition.trim()} onClick={() => {
            submitJob.mutate({ jobName: jobName.trim(), jobQueue: jobQueue.trim(), jobDefinition: jobDefinition.trim() }, { onSuccess: () => { setShowSubmitJob(false); setJobName(""); setJobQueue(""); setJobDefinition(""); } });
          }}>Submit</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          {submitJob.isError && <Alert type="error" dismissible>{(submitJob.error as Error)?.message || "Failed"}</Alert>}
          <SpaceBetween size="m">
            <FormField label="Job name"><Input value={jobName} onChange={({ detail }) => setJobName(detail.value)} /></FormField>
            <FormField label="Job queue ARN"><Input value={jobQueue} onChange={({ detail }) => setJobQueue(detail.value)} /></FormField>
            <FormField label="Job definition ARN"><Input value={jobDefinition} onChange={({ detail }) => setJobDefinition(detail.value)} /></FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  DocumentDB
// ────────────────────────────────────────────────────────

