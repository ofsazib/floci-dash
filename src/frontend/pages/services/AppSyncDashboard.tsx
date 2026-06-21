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

export function AppSyncDashboard() {
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
