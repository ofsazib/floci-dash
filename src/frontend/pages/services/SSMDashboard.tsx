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
} from "../../hooks/useECS";
import {
  useSSMParameters,
  useSSMParameter,
  usePutSSMParameter,
  useDeleteSSMParameter,
  useSSMGetParameters,
  useSSMParametersByPath,
  useSSMCommands,
  useSSMSendCommand,
  useSSMCommandInvocations,
  useSSMCancelCommand,
  useSSMDeleteParameters,
  useSSMLabelParameter,
  useSSMInstanceInformation,
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

export function SSMDashboard() {
  const { showToast } = useToast();
  const { data, isLoading, isError, error } = useSSMParameters();
  const putParam = usePutSSMParameter();
  const deleteParam = useDeleteSSMParameter();
  const getParamsBatch = useSSMGetParameters();
  const deleteParamsBatch = useSSMDeleteParameters();
  const labelParam = useSSMLabelParameter();
  const instancesQuery = useSSMInstanceInformation();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedParam, setSelectedParam] = useState<string | null>(null);
  const [showBatchGet, setShowBatchGet] = useState(false);
  const [batchNames, setBatchNames] = useState("");
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState("");
  const [submittedPath, setSubmittedPath] = useState<string | null>(null);
  const [labelTarget, setLabelTarget] = useState<{ name: string; version: number } | null>(null);
  const [labelName, setLabelName] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const pathResultsQuery = useSSMParametersByPath(submittedPath);

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

  function handleBatchGet() {
    const names = batchNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setBatchError("Enter at least one parameter name");
      return;
    }
    setBatchError(null);
    setBatchResults([]);
    getParamsBatch.mutate(
      { Names: names },
      {
        onSuccess: (res: any) => setBatchResults(res.parameters || []),
        onError: (e) => setBatchError((e as Error)?.message || "Batch get failed"),
      }
    );
  }

  function handleLabel() {
    const label = labelName.trim();
    if (!label) {
      setLabelError("Enter a label");
      return;
    }
    setLabelError(null);
    labelParam.mutate(
      { Name: labelTarget!.name, ParameterVersion: labelTarget!.version, Labels: [label] },
      {
        onSuccess: () => {
          setLabelTarget(null);
          setLabelName("");
        },
        onError: (e) => setLabelError((e as Error)?.message || "Labeling failed"),
      }
    );
  }

  if (selectedParam) {
    return (
      <SSMParameterDetail
        name={selectedParam}
        onBack={() => setSelectedParam(null)}
      />
    );
  }

  return (
    <ServiceDashboardLayout
      tabs={[
        {
          id: "parameters",
          label: "Parameters",
          content: (
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

              <Container
                header={
                  <Header variant="h3" actions={<Button onClick={() => setShowBatchGet(true)}>Batch get</Button>}>
                    Parameter Lookup
                  </Header>
                }
              >
                <SpaceBetween size="m">
                  <FormField label="Parameters by path" description="Load all parameters under a path">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Input
                        value={pathInput}
                        onChange={({ detail }) => setPathInput(detail.value)}
                        placeholder="/myapp"
                      />
                      <Button
                        onClick={() => setSubmittedPath(pathInput.trim())}
                        disabled={!pathInput.trim()}
                      >
                        Load by path
                      </Button>
                    </SpaceBetween>
                  </FormField>
                  {submittedPath && pathResultsQuery.data && (
                    <Box>
                      <Header variant="h3">Parameters under {submittedPath}</Header>
                      {(pathResultsQuery.data.parameters || []).length === 0 ? (
                        <Box variant="small" color="text-status-inactive">
                          No parameters found under this path.
                        </Box>
                      ) : (
                        <SpaceBetween size="xs">
                          {pathResultsQuery.data.parameters.map((p: any) => (
                            <Box key={p.Name}>
                              <Button variant="link" onClick={() => setSelectedParam(p.Name)}>
                                {p.Name}
                              </Button>
                              <Box variant="small" color="text-status-inactive">
                                {p.Value || "—"}
                              </Box>
                            </Box>
                          ))}
                        </SpaceBetween>
                      )}
                    </Box>
                  )}
                </SpaceBetween>
              </Container>

              <Modal
                visible={showBatchGet}
                onDismiss={() => setShowBatchGet(false)}
                header="Batch get parameters"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowBatchGet(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleBatchGet} loading={getParamsBatch.isPending}>
                        Get values
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <SpaceBetween size="m">
                  {batchError && (
                    <Alert type="error" dismissible onDismiss={() => setBatchError(null)}>
                      {batchError}
                    </Alert>
                  )}
                  <FormField label="Parameter names" description="Comma-separated">
                    <Input
                      value={batchNames}
                      onChange={({ detail }) => setBatchNames(detail.value)}
                      placeholder="/myapp/db-url, /myapp/api-key"
                    />
                  </FormField>
                  {batchResults.length > 0 && (
                    <SpaceBetween size="xs">
                      {batchResults.map((p: any) => (
                        <Box key={p.Name}>
                          <Box variant="awsui-key-label">{p.Name}</Box>
                          <Box variant="small">{p.Value || "—"}</Box>
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              variant="link"
                              onClick={() => setLabelTarget({ name: p.Name, version: p.Version ?? 1 })}
                            >
                              Label
                            </Button>
                            <DeleteButton
                              itemName={p.Name}
                              resourceType="parameter"
                              onDelete={() => deleteParamsBatch.mutateAsync([p.Name])}
                            />
                          </SpaceBetween>
                        </Box>
                      ))}
                    </SpaceBetween>
                  )}
                </SpaceBetween>
              </Modal>

              <Modal
                visible={!!labelTarget}
                onDismiss={() => setLabelTarget(null)}
                header="Label parameter version"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setLabelTarget(null)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleLabel} loading={labelParam.isPending}>
                        Apply label
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <SpaceBetween size="m">
                  {labelError && (
                    <Alert type="error" dismissible onDismiss={() => setLabelError(null)}>
                      {labelError}
                    </Alert>
                  )}
                  <FormField label="Label" description={`For ${labelTarget?.name} version ${labelTarget?.version}`}>
                    <Input
                      value={labelName}
                      onChange={({ detail }) => setLabelName(detail.value)}
                      placeholder="prod"
                    />
                  </FormField>
                </SpaceBetween>
              </Modal>

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
                        onChange={({ detail }) => setForm((p) => ({ ...p, type: detail.selectedOption!.value! }))}
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
          ),
        },
        {
          id: "run-command",
          label: "Run Command",
          content: <SSMRunCommandTab showToast={showToast} />,
        },
        {
          id: "instances",
          label: "Managed Instances",
          content: (
            <ResourceTable
              resourceName="Instance"
              headerTitle="SSM Managed Instances"
              headerCounter={instancesQuery.data?.total}
              items={instancesQuery.data?.instances || []}
              columns={[
                { id: "instanceId", header: "Instance ID", cell: (item: any) => item.InstanceId, isRowHeader: true },
                { id: "platform", header: "Platform", cell: (item: any) => item.PlatformName || item.PlatformType || "—" },
                { id: "version", header: "Agent Version", cell: (item: any) => item.AgentVersion || "—" },
                { id: "status", header: "Status", cell: (item: any) => item.PingStatus || "—" },
                { id: "type", header: "Instance Type", cell: (item: any) => item.InstanceType || "—" },
                { id: "lastPing", header: "Last Ping", cell: (item: any) => item.LastPingDateTime || "—" },
              ]}
              loading={instancesQuery.isLoading}
              emptyMessage="No managed instances found."
            />
          ),
        },
      ]}

    />
  );
}


function SSMRunCommandTab({ showToast }: { showToast: (t: "success" | "error", m: string) => void }) {
  const commandsQuery = useSSMCommands();
  const sendCommand = useSSMSendCommand();
  const cancelCommand = useSSMCancelCommand();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const invocationsQuery = useSSMCommandInvocations(selectedCommand);
  const [showSend, setShowSend] = useState(false);
  const [documentName, setDocumentName] = useState("AWS-RunShellScript");
  const [instanceIds, setInstanceIds] = useState("");
  const [commandsText, setCommandsText] = useState("");
  const [comment, setComment] = useState("");

  const commands = commandsQuery.data?.commands || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Command"
        headerTitle="Run Command History"
        headerCounter={commandsQuery.data?.total}
        items={commands.map((c) => ({
          id: c.commandId,
          documentName: c.documentName || "—",
          status: c.status || "—",
          comment: c.comment || "—",
          targets: c.targetCount ?? "—",
        }))}
        loading={commandsQuery.isLoading}
        emptyMessage="No commands sent yet"
        columns={[
          { id: "id", header: "Command ID", cell: (i: any) => i.id, isRowHeader: true },
          { id: "doc", header: "Document", cell: (i: any) => i.documentName },
          { id: "status", header: "Status", cell: (i: any) => <StatusBadge status={i.status} /> },
          { id: "comment", header: "Comment", cell: (i: any) => i.comment },
          { id: "targets", header: "Targets", cell: (i: any) => i.targets },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedCommand(i.id === selectedCommand ? null : i.id)}>
                  {i.id === selectedCommand ? "Hide" : "Invocations"}
                </Button>
                <Button
                  disabled={i.status === "Success" || i.status === "Cancelled"}
                  onClick={() =>
                    cancelCommand.mutate(i.id, {
                      onSuccess: () => showToast("success", "Command cancelled"),
                      onError: (e) => showToast("error", (e as Error).message || "Cancel failed"),
                    })
                  }
                >
                  Cancel
                </Button>
              </SpaceBetween>
            ),
          },
        ]}
        onCreate={() => setShowSend(true)}
      />

      {selectedCommand && (
        <Container header={<Header variant="h3" counter={invocationsQuery.data?.total}>Invocations</Header>}>
          <ResourceTable
            resourceName="Invocation"
            items={(invocationsQuery.data?.invocations || []).map((inv: any) => ({
              instanceId: inv.instanceId || "—",
              status: inv.status || "—",
              output: inv.standardOutputContent || "—",
            }))}
            columns={[
              { id: "instance", header: "Instance", cell: (i: any) => i.instanceId, isRowHeader: true },
              { id: "status", header: "Status", cell: (i: any) => i.status },
              { id: "output", header: "Output", cell: (i: any) => (
                <pre className="fd-code-bg" style={{ fontSize: 11, padding: 6, borderRadius: 4, margin: 0, whiteSpace: "pre-wrap" }}>{i.output}</pre>
              ) },
            ]}
            emptyMessage="No invocations"
            loading={invocationsQuery.isLoading}
          />
        </Container>
      )}

      <Modal
        visible={showSend}
        onDismiss={() => setShowSend(false)}
        header="Send command"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowSend(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={sendCommand.isPending}
                disabled={!documentName.trim() || !instanceIds.trim()}
                onClick={() => {
                  sendCommand.mutate(
                    {
                      documentName: documentName.trim(),
                      instanceIds: instanceIds.split(",").map((s) => s.trim()).filter(Boolean),
                      parameters: commandsText.trim() ? { commands: commandsText.trim().split("\n") } : undefined,
                      comment: comment.trim() || undefined,
                    },
                    {
                      onSuccess: () => {
                        setShowSend(false);
                        setInstanceIds(""); setCommandsText(""); setComment("");
                        showToast("success", "Command sent");
                      },
                      onError: (e) => showToast("error", (e as Error).message || "Send failed"),
                    }
                  );
                }}
              >
                Send
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Document name">
              <Input value={documentName} onChange={({ detail }) => setDocumentName(detail.value)} placeholder="AWS-RunShellScript" />
            </FormField>
            <FormField label="Instance IDs (comma-separated)">
              <Input value={instanceIds} onChange={({ detail }) => setInstanceIds(detail.value)} placeholder="i-123,i-456" />
            </FormField>
            <FormField label="Commands (one per line)">
              <Textarea value={commandsText} onChange={({ detail }) => setCommandsText(detail.value)} rows={4} placeholder="echo hello" />
            </FormField>
            <FormField label="Comment (optional)">
              <Input value={comment} onChange={({ detail }) => setComment(detail.value)} />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
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
                          ? item.Value!.slice(0, 60) + "…"
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


const SSM_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "String", value: "String" },
  { label: "StringList", value: "StringList" },
  { label: "SecureString", value: "SecureString" },
];
