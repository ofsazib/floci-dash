// @v8 ignore start — JSX-heavy dashboard, callbacks tested via integration
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
  useCreateAPIGatewayResource,
  useDeleteAPIGatewayResource,
  useCreateAPIGatewayDeployment,
  useDeleteAPIGatewayDeployment,
  useAPIGatewayStages,
  useCreateAPIGatewayStage,
  useDeleteAPIGatewayStage,
  useAPIGatewayAuthorizers,
  useCreateAPIGatewayAuthorizer,
  useDeleteAPIGatewayAuthorizer,
  useAPIGatewayApiKeys,
  useCreateAPIGatewayApiKey,
  useDeleteAPIGatewayApiKey,
  useAPIGatewayUsagePlans,
  useCreateAPIGatewayUsagePlan,
  useDeleteAPIGatewayUsagePlan,
  useAPIGatewayRequestValidators,
  useCreateAPIGatewayRequestValidator,
  useDeleteAPIGatewayRequestValidator,
  useAPIGatewayModels,
  useCreateAPIGatewayModel,
  useDeleteAPIGatewayModel,
  useAPIGatewayDomainNames,
  useCreateAPIGatewayDomainName,
  useDeleteAPIGatewayDomainName,
  useAPIGatewayAccount,
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

export function APIGatewayDashboard() {
  const { data, isLoading } = useAPIGatewayApis();
  const createApi = useCreateAPIGatewayApi();
  const deleteApi = useDeleteAPIGatewayApi();
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState("apis");
  const [form, setForm] = useState({ name: "", description: "" });
  const { showToast } = useToast();

  // API Keys
  const { data: keysData, isLoading: keysLoading } = useAPIGatewayApiKeys();
  const createApiKey = useCreateAPIGatewayApiKey();
  const deleteApiKey = useDeleteAPIGatewayApiKey();
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: "", description: "", enabled: true });

  // Usage Plans
  const { data: plansData, isLoading: plansLoading } = useAPIGatewayUsagePlans();
  const createPlan = useCreateAPIGatewayUsagePlan();
  const deletePlan = useDeleteAPIGatewayUsagePlan();
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", description: "" });

  // Domain Names
  const { data: domainsData, isLoading: domainsLoading } = useAPIGatewayDomainNames();
  const createDomain = useCreateAPIGatewayDomainName();
  const deleteDomain = useDeleteAPIGatewayDomainName();

  const apis = data?.apis || [];
  const apiKeys = keysData?.apiKeys || [];
  const usagePlans = plansData?.usagePlans || [];
  const domainNames = domainsData?.domainNames || [];

  if (selectedApi) {
    return <APIGatewayApiDetail apiId={selectedApi} onBack={() => setSelectedApi(null)} />;
  }

  const apiColumns = [
    { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
    { id: "id", header: "API ID", cell: (item: any) => item.id },
    { id: "description", header: "Description", cell: (item: any) => item.description || "—" },
    { id: "created", header: "Created", cell: (item: any) => item.createdDate ? new Date(item.createdDate).toLocaleDateString() : "—" },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedApi(item.id)}>
            View
          </Button>
          <DeleteButton
            itemName={item.name}
            resourceType="REST API"
            loading={deleteApi.isPending}
            onDelete={() => deleteApi.mutateAsync(item.id)}
          />
        </SpaceBetween>
      ),
    },
  ];

  const tabs: TabsProps.Tab[] = [
    {
      id: "apis",
      label: "REST APIs",
      content: (
        <>
          <ResourceTable
            resourceName="REST API"
            headerCounter={data?.total}
            items={apis}
            columns={apiColumns}
            loading={isLoading}
            emptyMessage="No REST APIs found. Create one to get started."
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
            header="Create REST API"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    loading={createApi.isPending}
                    disabled={!form.name.trim()}
                    onClick={() => {
                      createApi.mutate(form, {
                        onSuccess: () => { setShowCreate(false); setForm({ name: "", description: "" }); },
                      });
                    }}
                  >Create</Button>
                </SpaceBetween>
              </Box>
            }
          >
            <Form>
              {createApi.isError && (
                <Alert type="error" dismissible>
                  {(createApi.error as Error)?.message || "Failed to create REST API"}
                </Alert>
              )}
              <SpaceBetween size="m">
                <FormField label="API name"><Input value={form.name} onChange={({ detail }) => setForm((p) => ({ ...p, name: detail.value }))} placeholder="my-api" /></FormField>
                <FormField label="Description (optional)"><Input value={form.description} onChange={({ detail }) => setForm((p) => ({ ...p, description: detail.value }))} /></FormField>
              </SpaceBetween>
            </Form>
          </Modal>
        </>
      ),
    },
    {
      id: "keys",
      label: "API Keys",
      content: (
        <>
          <ResourceTable
            resourceName="API Key"
            items={apiKeys}
            columns={[
              { id: "name", header: "Name", cell: (item: any) => item.name || item.id, isRowHeader: true },
              { id: "id", header: "Key ID", cell: (item: any) => item.id },
              { id: "enabled", header: "Enabled", cell: (item: any) => item.enabled !== false ? "Yes" : "No" },
              { id: "created", header: "Created", cell: (item: any) => item.createdDate ? new Date(item.createdDate).toLocaleString() : "—" },
            ]}
            loading={keysLoading}
            emptyMessage="No API keys found."
            onCreate={() => setShowCreateKey(true)}
          />
          <Modal visible={showCreateKey} onDismiss={() => setShowCreateKey(false)} header="Create API Key"
            footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateKey(false)}>Cancel</Button>
              <Button variant="primary" loading={createApiKey.isPending}
                onClick={() => { createApiKey.mutate(keyForm, { onSuccess: () => { setShowCreateKey(false); setKeyForm({ name: "", description: "", enabled: true }); showToast("success", "API key created"); } }); }}>Create</Button>
            </SpaceBetween></Box>}
          >
            <Form><SpaceBetween size="m">
              <FormField label="Key name"><Input value={keyForm.name} onChange={({ detail }) => setKeyForm((p) => ({ ...p, name: detail.value }))} placeholder="my-api-key" /></FormField>
              <FormField label="Description"><Input value={keyForm.description} onChange={({ detail }) => setKeyForm((p) => ({ ...p, description: detail.value }))} /></FormField>
            </SpaceBetween></Form>
          </Modal>
        </>
      ),
    },
    {
      id: "plans",
      label: "Usage Plans",
      content: (
        <>
          <ResourceTable
            resourceName="Usage Plan"
            items={usagePlans}
            columns={[
              { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
              { id: "id", header: "ID", cell: (item: any) => item.id },
              { id: "description", header: "Description", cell: (item: any) => item.description || "—" },
            ]}
            loading={plansLoading}
            emptyMessage="No usage plans found."
            onCreate={() => setShowCreatePlan(true)}
          />
          <Modal visible={showCreatePlan} onDismiss={() => setShowCreatePlan(false)} header="Create Usage Plan"
            footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreatePlan(false)}>Cancel</Button>
              <Button variant="primary" loading={createPlan.isPending}
                onClick={() => { createPlan.mutate(planForm, { onSuccess: () => { setShowCreatePlan(false); setPlanForm({ name: "", description: "" }); showToast("success", "Usage plan created"); } }); }}>Create</Button>
            </SpaceBetween></Box>}
          >
            <Form><SpaceBetween size="m">
              <FormField label="Plan name"><Input value={planForm.name} onChange={({ detail }) => setPlanForm((p) => ({ ...p, name: detail.value }))} placeholder="my-plan" /></FormField>
              <FormField label="Description"><Input value={planForm.description} onChange={({ detail }) => setPlanForm((p) => ({ ...p, description: detail.value }))} /></FormField>
            </SpaceBetween></Form>
          </Modal>
        </>
      ),
    },
    {
      id: "domains",
      label: "Domain Names",
      content: (
        <ResourceTable
          resourceName="Domain Name"
          items={domainNames}
          columns={[
            { id: "domainName", header: "Domain Name", cell: (item: any) => item.domainName, isRowHeader: true },
            { id: "certificateArn", header: "Certificate", cell: (item: any) => item.certificateArn ? item.certificateArn.split('/').pop() : "—" },
          ]}
          loading={domainsLoading}
          emptyMessage="No domain names found."
        />
      ),
    },
  ];

  return (
    <Tabs activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} tabs={tabs} />
  );
}


function APIGatewayApiDetail({ apiId, onBack }: { apiId: string; onBack: () => void }) {
  const { data: apiData } = useAPIGatewayApi(apiId);
  const { data: resData, isLoading: resLoading, isError: resIsError, error: resError } = useAPIGatewayResources(apiId);
  const { data: deployData, isLoading: deployLoading } = useAPIGatewayDeployments(apiId);
  const { data: stagesData, isLoading: stagesLoading } = useAPIGatewayStages(apiId);
  const { data: authData, isLoading: authLoading } = useAPIGatewayAuthorizers(apiId);
  const { data: validatorsData, isLoading: validatorsLoading } = useAPIGatewayRequestValidators(apiId);
  const { data: modelsData, isLoading: modelsLoading } = useAPIGatewayModels(apiId);
  const createResource = useCreateAPIGatewayResource(apiId);
  const deleteResource = useDeleteAPIGatewayResource(apiId);
  const createDeployment = useCreateAPIGatewayDeployment(apiId);
  const deleteDeployment = useDeleteAPIGatewayDeployment(apiId);
  const createStage = useCreateAPIGatewayStage(apiId);
  const deleteStage = useDeleteAPIGatewayStage(apiId);
  const createAuth = useCreateAPIGatewayAuthorizer(apiId);
  const deleteAuth = useDeleteAPIGatewayAuthorizer(apiId);
  const createValidator = useCreateAPIGatewayRequestValidator(apiId);
  const deleteValidator = useDeleteAPIGatewayRequestValidator(apiId);
  const createModel = useCreateAPIGatewayModel(apiId);
  const deleteModel = useDeleteAPIGatewayModel(apiId);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("resources");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, string>>({});

  const api = apiData?.api;
  const resources = resData?.resources || [];
  const deployments = deployData?.deployments || [];
  const stages = stagesData?.stages || [];
  const authorizers = authData?.authorizers || [];
  const validators = validatorsData?.requestValidators || [];
  const models = modelsData?.models || [];

  const loading = resLoading || deployLoading || stagesLoading || authLoading || validatorsLoading || modelsLoading;

  const resetCreate = () => { setShowCreate(false); setCreateForm({}); };

  const tabs: TabsProps.Tab[] = [
    {
      id: "resources",
      label: "Resources",
      content: (
        <>
          {resIsError && (
            <StatusIndicator type="error">
              {(resError as Error)?.message || "Failed to load resources"}
            </StatusIndicator>
          )}
          <ResourceTable
            resourceName="Resource"
            items={resources}
            columns={[
              { id: "path", header: "Path", cell: (item: any) => item.path, isRowHeader: true },
              { id: "id", header: "Resource ID", cell: (item: any) => item.id },
              {
                id: "methods",
                header: "Methods",
                cell: (item: any) => {
                  const methods = Object.keys(item.resourceMethods || {});
                  return methods.length > 0 ? methods.join(", ") : "—";
                },
              },
            ]}
            loading={resLoading}
            emptyMessage="No resources found."
          />
        </>
      ),
    },
    {
      id: "deployments",
      label: "Deployments",
      content: (
        <ResourceTable
          resourceName="Deployment"
          items={deployments}
          columns={[
            { id: "id", header: "Deployment ID", cell: (item: any) => item.id, isRowHeader: true },
            { id: "stage", header: "Stage", cell: (item: any) => item.stageName || "—" },
            {
              id: "date",
              header: "Created",
              cell: (item: any) => item.createdDate ? new Date(item.createdDate).toLocaleString() : "—",
            },
          ]}
          loading={deployLoading}
          emptyMessage="No deployments found."
        />
      ),
    },
    {
      id: "stages",
      label: "Stages",
      content: (
        <ResourceTable
          resourceName="Stage"
          items={stages}
          columns={[
            { id: "name", header: "Stage Name", cell: (item: any) => item.stageName, isRowHeader: true },
            { id: "deploy", header: "Deployment ID", cell: (item: any) => item.deploymentId || "—" },
            { id: "created", header: "Created", cell: (item: any) => item.createdDate ? new Date(item.createdDate).toLocaleString() : "—" },
          ]}
          loading={stagesLoading}
          emptyMessage="No stages found."
        />
      ),
    },
    {
      id: "authorizers",
      label: "Authorizers",
      content: (
        <ResourceTable
          resourceName="Authorizer"
          items={authorizers}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "type", header: "Type", cell: (item: any) => item.type || "—" },
            { id: "id", header: "ID", cell: (item: any) => item.id },
          ]}
          loading={authLoading}
          emptyMessage="No authorizers found."
        />
      ),
    },
    {
      id: "validators",
      label: "Request Validators",
      content: (
        <ResourceTable
          resourceName="Request Validator"
          items={validators}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "id", header: "ID", cell: (item: any) => item.id },
            { id: "validateRequestBody", header: "Body", cell: (item: any) => item.validateRequestBody ? "Yes" : "No" },
            { id: "validateRequestParameters", header: "Params", cell: (item: any) => item.validateRequestParameters ? "Yes" : "No" },
          ]}
          loading={validatorsLoading}
          emptyMessage="No request validators found."
        />
      ),
    },
    {
      id: "models",
      label: "Models",
      content: (
        <ResourceTable
          resourceName="Model"
          items={models}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "contentType", header: "Content Type", cell: (item: any) => item.contentType || "—" },
            { id: "id", header: "ID", cell: (item: any) => item.id },
          ]}
          loading={modelsLoading}
          emptyMessage="No models found."
        />
      ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to REST APIs
      </Button>

      <Header variant="h2" description={api?.description || `API ID: ${apiId}`}>
        {api?.name || "REST API"}
      </Header>

      {loading && <Spinner />}

      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={tabs}
      />
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  AppSync
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
// @v8 ignore end

