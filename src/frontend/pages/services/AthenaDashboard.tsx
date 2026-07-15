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
  Table,
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
  useAthenaWorkGroup,
  useAthenaQueryExecutions,
  useAthenaQueryExecution,
  useAthenaQueryResults,
  useStopAthenaQuery,
  useAthenaDataCatalogs,
  useAthenaDatabases,
  useAthenaTables,
  useAthenaTableMetadata,
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

export function AthenaDashboard() {
  const [activeTab, setActiveTab] = useState("work-groups");
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [selectedWG, setSelectedWG] = useState<string | null>(null);
  const { data: wgData, isLoading } = useAthenaWorkGroups();
  const deleteWg = useDeleteAthenaWorkGroup();
  const createWg = useCreateAthenaWorkGroup();
  const { data: qeData } = useAthenaQueryExecutions();
  const { showToast } = useToast();

  if (isLoading) return <TableSkeleton />;

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      tabs={[
        {
          id: "work-groups",
          label: "Work Groups",
          content: (
            <WorkGroupsTab
              data={wgData}
              deleteWg={deleteWg}
              createWg={createWg}
              showToast={showToast}
              onSelect={(name: string) => { setSelectedWG(name); setActiveTab("wg-detail"); }}
            />
          ),
        },
        ...(selectedWG ? [{
          id: "wg-detail",
          label: `WG: ${selectedWG}`,
          content: <WorkGroupDetail name={selectedWG} onBack={() => setActiveTab("work-groups")} />,
        }] : []),
        {
          id: "query-executions",
          label: "Query Executions",
          content: (
            <QueryExecutionsTab
              data={qeData}
              onSelect={(id: string) => { setSelectedExecution(id); setActiveTab("query-results"); }}
            />
          ),
        },
        ...(selectedExecution ? [{
          id: "query-results",
          label: "Query Results",
          content: <QueryResultsView executionId={selectedExecution} onBack={() => setActiveTab("query-executions")} />,
        }] : []),
        {
          id: "catalogs",
          label: "Catalogs & Databases",
          content: <CatalogsTab />,
        },
      ]}
    />
  );
}

// ── Athena Work Groups Tab ──────────────────────────────

function WorkGroupsTab({ data, deleteWg, createWg, showToast, onSelect }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  return (
    <>
      <Box padding={{ bottom: "s" }}>
        <Button variant="primary" onClick={() => setShowCreate(true)}>Create Work Group</Button>
      </Box>
      <ResourceTable
        resourceName="Work Group"
        headerTitle="Athena Work Groups"
        headerCounter={data?.total}
        items={(data?.workGroups || []).map((w: any) => ({
          name: w.Name,
          state: w.State || "ENABLED",
          description: w.Description || "-",
          created: w.CreationTime ? new Date(w.CreationTime).toLocaleDateString() : "-",
        }))}
        loading={false}
        emptyMessage="No work groups"
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "state", header: "State", cell: (i: any) => i.state },
          { id: "description", header: "Description", cell: (i: any) => i.description },
          { id: "created", header: "Created", cell: (i: any) => i.created },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="normal" onClick={() => onSelect(i.name)}>Details</Button>
                {i.name !== "primary" && (
                  <DeleteButton
                    itemName={i.name}
                    resourceType="work group"
                    loading={deleteWg.isPending && deleteWg.variables === i.name}
                    onDelete={() => deleteWg.mutateAsync(i.name)}
                  />
                )}
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find work groups"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
        header="Create Work Group"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => { setShowCreate(false); setNewName(""); }}>Cancel</Button>
            <Button variant="primary" loading={createWg.isPending} disabled={!newName.trim()}
              onClick={() => createWg.mutate({ name: newName, description: newDesc }, {
                onSuccess: () => { showToast("success", `Work group \"${newName}\" created`); setShowCreate(false); setNewName(""); setNewDesc(""); },
                onError: (e: any) => showToast("error", e.message),
              })}>
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <Form>
          <FormField label="Name" description="Must be unique">
            <Input value={newName} onChange={({ detail }) => setNewName(detail.value)} placeholder="my-workgroup" />
          </FormField>
          <FormField label="Description">
            <Input value={newDesc} onChange={({ detail }) => setNewDesc(detail.value)} placeholder="Optional description" />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

// ── Work Group Detail ───────────────────────────────────

function WorkGroupDetail({ name, onBack }: { name: string; onBack: () => void }) {
  const { data, isLoading } = useAthenaWorkGroup(name);
  if (isLoading) return <Spinner />;
  const wg = data?.workGroup;

  return (
    <SpaceBetween size="l">
      <Button variant="link" onClick={onBack}>← Back to Work Groups</Button>
      {wg ? (
        <Container header={<Header variant="h2">{wg.Name}</Header>}>
          <SpaceBetween size="m">
            <ColumnLayout columns={3} variant="text-grid">
              <div><Box variant="small" color="text-body-secondary">State</Box><Box variant="strong">{wg.State || "—"}</Box></div>
              <div><Box variant="small" color="text-body-secondary">Description</Box><Box>{wg.Description || "—"}</Box></div>
              <div><Box variant="small" color="text-body-secondary">Creation Time</Box><Box>{wg.CreationTime ? new Date(wg.CreationTime).toLocaleString() : "—"}</Box></div>
            </ColumnLayout>
            {wg.Configuration && (
              <Container header={<Header variant="h3">Configuration</Header>}>
                <SpaceBetween size="s">
                  <div><Box variant="small" color="text-body-secondary">Output Location</Box>
                    <code style={{ fontSize: 12 }}>{wg.Configuration.ResultConfiguration?.OutputLocation || "—"}</code></div>
                  <div><Box variant="small" color="text-body-secondary">Enforce Configuration</Box>
                    <Box>{wg.Configuration.EnforceWorkGroupConfiguration ? "Yes" : "No"}</Box></div>
                  <div><Box variant="small" color="text-body-secondary">Publish Metrics</Box>
                    <Box>{wg.Configuration.PublishCloudWatchMetricsEnabled ? "Yes" : "No"}</Box></div>
                </SpaceBetween>
              </Container>
            )}
          </SpaceBetween>
        </Container>
      ) : (
        <Box color="text-body-secondary">Work group not found.</Box>
      )}
    </SpaceBetween>
  );
}

// ── Query Executions Tab ────────────────────────────────

function QueryExecutionsTab({ data, onSelect }: any) {
  const stopQuery = useStopAthenaQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: detail } = useAthenaQueryExecution(selectedId);

  function openDetail(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function getStatusType(state: string) {
    if (state === "SUCCEEDED") return "success" as const;
    if (state === "FAILED") return "error" as const;
    return "in-progress" as const;
  }

  return (
    <>
      <Table
        variant="full-page"
        header={<Header variant="h2" counter={`(${data?.total || 0})`}>Query Executions</Header>}
        columnDefinitions={[
          { id: "id", header: "Query Execution ID", cell: (i: any) => <code style={{ fontSize: 12 }}>{i.id}</code>, isRowHeader: true },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="normal" onClick={() => onSelect(i.id)}>View Results</Button>
                <Button variant="normal" onClick={() => openDetail(i.id)}>Detail</Button>
                <Button variant="normal" iconName="close" loading={stopQuery.isPending && stopQuery.variables === i.id}
                  onClick={() => stopQuery.mutate(i.id)}>Stop</Button>
              </SpaceBetween>
            ),
          },
        ]}
        items={(data?.queryExecutionIds || []).map((id: string) => ({ id }))}
        loading={false}
        empty={<Box textAlign="center" padding={{ top: "xl" }}>No query executions.</Box>}
      />
      <Modal visible={detailOpen} onDismiss={() => setDetailOpen(false)} header="Query Execution Detail" size="large">
        {detail?.queryExecution && (
          <SpaceBetween size="m">
            <ColumnLayout columns={2} variant="text-grid">
              <div><Box variant="small" color="text-body-secondary">ID</Box><code style={{ fontSize: 12 }}>{detail.queryExecution.QueryExecutionId}</code></div>
              <div><Box variant="small" color="text-body-secondary">Status</Box>
                <StatusIndicator type={getStatusType(detail.queryExecution.Status?.State || "")}>
                  {detail.queryExecution.Status?.State || "—"}
                </StatusIndicator>
              </div>
              <div><Box variant="small" color="text-body-secondary">Work Group</Box><Box>{detail.queryExecution.WorkGroup || "—"}</Box></div>
              <div><Box variant="small" color="text-body-secondary">Data Scanned</Box><Box>{detail.queryExecution.Statistics?.DataScannedInBytes ? formatBytes(detail.queryExecution.Statistics.DataScannedInBytes) : "—"}</Box></div>
            </ColumnLayout>
            {detail.queryExecution.Query && (
              <Container header={<Header variant="h3">SQL Query</Header>}>
                <Box variant="code"><pre className="fd-code-block" style={{ fontSize: 13, maxHeight: 200, overflow: "auto" }}>{detail.queryExecution.Query}</pre></Box>
              </Container>
            )}
            {detail.queryExecution.Status?.StateChangeReason && (
              <Alert type={detail.queryExecution.Status.State === "FAILED" ? "error" : "info"}>
                {detail.queryExecution.Status.StateChangeReason}
              </Alert>
            )}
          </SpaceBetween>
        )}
      </Modal>
    </>
  );
}

// ── Query Results View ──────────────────────────────────

function QueryResultsView({ executionId, onBack }: { executionId: string; onBack: () => void }) {
  const { data, isLoading } = useAthenaQueryResults(executionId);

  if (isLoading) return <Spinner />;

  return (
    <SpaceBetween size="l">
      <Button variant="link" onClick={onBack}>← Back to Executions</Button>
      <Container header={<Header variant="h2" counter={data ? `(${data.totalRows} rows)` : undefined}>Query Results — {executionId}</Header>}>
        {!data || data.totalRows === 0 ? (
          <Box color="text-body-secondary" padding={{ top: "m", bottom: "m" }}>No results available.</Box>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table
              header={<Header variant="h3" counter={`(${data.totalRows})`}>Result Rows</Header>}
              columnDefinitions={[
                ...(data!.headers.length > 0
                  ? data!.headers.map((h: any, i: number) => ({
                      id: `col-${i}`,
                      header: h.name || `Col ${i + 1}`,
                      cell: (row: string[]) => <code style={{ fontSize: 12 }}>{row[i] || ""}</code>,
                    }))
                  : [{ id: "data", header: "Data", cell: (row: string[]) => row.join(", ") }]),
              ]}
              items={data!.rows}
            />
          </div>
        )}
        {(data?.headers?.length ?? 0) > 0 && (
          <Container header={<Header variant="h3">Column Info</Header>}>
            <SpaceBetween size="xs">
              {data!.headers.map((h: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <Box variant="strong">{h.name}:</Box>
                  <Box variant="small" color="text-body-secondary">{h.type}</Box>
                  {h.label && h.label !== h.name && <Box variant="small">({h.label})</Box>}
                </div>
              ))}
            </SpaceBetween>
          </Container>
        )}
      </Container>
    </SpaceBetween>
  );
}

// ── Catalogs & Databases Browser ─────────────────────────

function CatalogsTab() {
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const { data: catalogs } = useAthenaDataCatalogs();
  const { data: databases } = useAthenaDatabases();
  const { data: tables } = useAthenaTables(selectedDb);
  const { data: tableMeta } = useAthenaTableMetadata(selectedDb, selectedTable);

  return (
    <SpaceBetween size="l">
      <ColumnLayout columns={3} variant="text-grid">
        <Container header={<Header variant="h3" counter={catalogs ? `(${catalogs.total})` : undefined}>Data Catalogs</Header>}>
          {(catalogs?.dataCatalogs || []).map((c: any) => (
            <Box key={c.CatalogName} padding={{ bottom: "xxs" }}>
              <Button variant={selectedCatalog === c.CatalogName ? "primary" : "link"}
                onClick={() => setSelectedCatalog(c.CatalogName)}>{c.CatalogName}</Button>
            </Box>
          ))}
        </Container>
        <Container header={<Header variant="h3" counter={databases ? `(${databases.total})` : undefined}>Databases</Header>}>
          {(databases?.databases || []).map((d: any) => (
            <Box key={d.Name} padding={{ bottom: "xxs" }}>
              <Button variant={selectedDb === d.Name ? "primary" : "link"}
                onClick={() => { setSelectedDb(d.Name); setSelectedTable(null); }}>{d.Name}</Button>
            </Box>
          ))}
        </Container>
        <Container header={<Header variant="h3" counter={tables ? `(${tables.total})` : undefined}>Tables {selectedDb ? `in ${selectedDb}` : ""}</Header>}>
          {selectedDb ? (
            (tables?.tables || []).map((t: any) => (
              <Box key={t.Name} padding={{ bottom: "xxs" }}>
                <Button variant={selectedTable === t.Name ? "primary" : "link"}
                  onClick={() => setSelectedTable(t.Name)}>{t.Name}</Button>
              </Box>
            ))
          ) : (
            <Box color="text-body-secondary">Select a database</Box>
          )}
        </Container>
      </ColumnLayout>

      {selectedTable && tableMeta?.tableMetadata && (
        <Container header={<Header variant="h2">Table: {selectedTable}</Header>}>
          <SpaceBetween size="m">
            <ColumnLayout columns={3} variant="text-grid">
              <div><Box variant="small" color="text-body-secondary">Name</Box><Box variant="strong">{tableMeta.tableMetadata.Name}</Box></div>
              <div><Box variant="small" color="text-body-secondary">Columns</Box><Box>{tableMeta.tableMetadata.Columns?.length || 0}</Box></div>
              <div><Box variant="small" color="text-body-secondary">Partition Keys</Box><Box>{tableMeta.tableMetadata.PartitionKeys?.length || 0}</Box></div>
            </ColumnLayout>
            {(tableMeta.tableMetadata.Columns || []).length > 0 && (
              <Table
                header={<Header variant="h3" counter={`(${tableMeta.tableMetadata.Columns.length})`}>Columns</Header>}
                columnDefinitions={[
                  { id: "name", header: "Name", cell: (c: any) => c.Name, isRowHeader: true },
                  { id: "type", header: "Type", cell: (c: any) => <code style={{ fontSize: 12 }}>{c.Type}</code> },
                  { id: "comment", header: "Comment", cell: (c: any) => c.Comment || "—" },
                ]}
                items={tableMeta.tableMetadata.Columns}
              />
            )}
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  Glue
// ────────────────────────────────────────────────────────

