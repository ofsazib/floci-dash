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
  Pagination,
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
  LOGS_PAGE_SIZE,
  useLogGroups,
  useCreateLogGroup,
  useDeleteLogGroup,
  usePutRetentionPolicy,
  useDeleteRetentionPolicy,
  useLogStreams,
  useCreateLogStream,
  useDeleteLogStream,
  useLogEvents,
  useFilteredLogEvents,
  usePutLogEvents,
  useSubscriptionFilters,
  usePutSubscriptionFilter,
  useDeleteSubscriptionFilter,
  useLogGroupTags,
  useTagLogGroup,
  useDataProtectionPolicy,
  useUntagLogGroup,
  useAccountPolicies,
  usePutAccountPolicy,
  useMetricFilters,
  usePutMetricFilter,
  useDeleteMetricFilter,
  useTestMetricFilter,
  usePutDestination,
  usePutDestinationPolicy,
  useResourcePolicies,
  usePutResourcePolicy,
  usePutLogGroupDeletionProtection,
  useStartQuery,
  useStopQuery,
  useQueryResults,
  type LogDestination,
  type MetricFilterMatch,
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

export function CloudWatchLogsDashboard() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (selectedGroup) {
    return (
      <CloudWatchLogGroupDetail
        name={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "log-groups",
      label: "Log Groups",
      content: <CloudWatchLogGroupList onSelect={(name) => setSelectedGroup(name)} />,
    },
    {
      id: "log-management",
      label: "Log Management",
      content: <CloudWatchLogManagement />,
    },
  ];

  return <Tabs tabs={tabs} />;
}

// ─── Log Management (account policies, metric filters, ──
//     destinations, resource policies, Insights) ─────────

const ACCOUNT_POLICY_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "DATA_PROTECTION", value: "DATA_PROTECTION" },
  { label: "SUBSCRIPTION_FILTER", value: "SUBSCRIPTION_FILTER" },
  { label: "FIELD_INDEX", value: "FIELD_INDEX" },
];

const ACCOUNT_POLICY_SCOPE_OPTIONS: SelectProps.Option[] = [
  { label: "ACCOUNT", value: "ACCOUNT" },
];

function formatPolicyTime(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function CloudWatchLogManagement() {
  const [activeTab, setActiveTab] = useState("account-policies");

  const tabs: TabsProps.Tab[] = [
    { id: "account-policies", label: "Account Policies", content: <CloudWatchAccountPoliciesPanel /> },
    { id: "metric-filters", label: "Metric Filters", content: <CloudWatchMetricFiltersPanel /> },
    { id: "destinations", label: "Destinations", content: <CloudWatchDestinationsPanel /> },
    { id: "resource-policies", label: "Resource Policies", content: <CloudWatchResourcePoliciesPanel /> },
    { id: "deletion-protection", label: "Deletion Protection", content: <CloudWatchDeletionProtectionPanel /> },
    { id: "insights", label: "Logs Insights", content: <CloudWatchInsightsConsole /> },
  ];

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      tabs={tabs}
    />
  );
}

function CloudWatchAccountPoliciesPanel() {
  const { showToast } = useToast();
  const { data, isLoading, isError, error } = useAccountPolicies();
  const putPolicy = usePutAccountPolicy();
  const [showCreate, setShowCreate] = useState(false);
  const [policyType, setPolicyType] = useState<SelectProps.Option>(ACCOUNT_POLICY_TYPE_OPTIONS[0]);
  const [scope, setScope] = useState<SelectProps.Option>(ACCOUNT_POLICY_SCOPE_OPTIONS[0]);
  const [form, setForm] = useState({ policyName: "", policyDocument: "" });

  const items = (data?.accountPolicies || []).map((p) => ({
    policyName: p.policyName,
    policyType: p.policyType,
    scope: p.scope,
    policyDocument: p.policyDocument,
    lastUpdatedTime: p.lastUpdatedTime,
  }));

  function handleCreate() {
    putPolicy.mutate(
      {
        policyName: form.policyName,
        policyDocument: form.policyDocument,
        policyType: policyType.value!,
        scope: scope.value,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ policyName: "", policyDocument: "" });
          showToast("success", `Account policy ${form.policyName} saved`);
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load account policies"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Account Policy"
        headerTitle="Account Policies"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Policy name",
            cell: (item: any) => item.policyName,
            isRowHeader: true,
          },
          { id: "type", header: "Type", cell: (item: any) => item.policyType },
          { id: "scope", header: "Scope", cell: (item: any) => item.scope || "—" },
          {
            id: "updated",
            header: "Last updated",
            cell: (item: any) => formatPolicyTime(item.lastUpdatedTime),
          },
          {
            id: "document",
            header: "Document",
            cell: (item: any) => (
              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {item.policyDocument}
              </span>
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No account policies. Create one to get started."
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Put Account Policy"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putPolicy.isPending}
                disabled={!form.policyName || !form.policyDocument}
                onClick={handleCreate}
              >
                Save policy
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putPolicy.isError && (
            <Alert type="error" dismissible>
              {(putPolicy.error as Error)?.message || "Failed to save account policy"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Policy name">
              <Input
                value={form.policyName}
                onChange={({ detail }) => setForm((p) => ({ ...p, policyName: detail.value }))}
                placeholder="my-data-protection-policy"
              />
            </FormField>
            <FormField label="Policy type">
              <Select
                selectedOption={policyType}
                onChange={({ detail }) => setPolicyType(detail.selectedOption)}
                options={ACCOUNT_POLICY_TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Scope">
              <Select
                selectedOption={scope}
                onChange={({ detail }) => setScope(detail.selectedOption)}
                options={ACCOUNT_POLICY_SCOPE_OPTIONS}
              />
            </FormField>
            <FormField
              label="Policy document"
              description="JSON policy document."
            >
              <Textarea
                value={form.policyDocument}
                onChange={({ detail }) => setForm((p) => ({ ...p, policyDocument: detail.value }))}
                rows={5}
                placeholder='{"Rules":[]}'
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function CloudWatchMetricFiltersPanel() {
  const { showToast } = useToast();
  const [groupInput, setGroupInput] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useMetricFilters(group);
  const putFilter = usePutMetricFilter();
  const deleteFilter = useDeleteMetricFilter();
  const testFilter = useTestMetricFilter();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    filterName: "",
    filterPattern: "",
    metricName: "",
    metricNamespace: "",
    metricValue: "1",
  });
  const [showTest, setShowTest] = useState(false);
  const [testPattern, setTestPattern] = useState("");
  const [testMessages, setTestMessages] = useState("");
  const [testResult, setTestResult] = useState<{
    matches: MetricFilterMatch[];
    total: number;
  } | null>(null);

  const items = (data?.metricFilters || []).map((f) => ({
    filterName: f.filterName,
    filterPattern: f.filterPattern,
    logGroupName: f.logGroupName,
    creationTime: f.creationTime,
    transformations: f.metricTransformations
      .map((t) => `${t.metricNamespace}/${t.metricName}`)
      .join(", "),
  }));

  function handleLoad() {
    setGroup(groupInput.trim() || null);
  }

  function handleCreate() {
    putFilter.mutate(
      {
        logGroupName: group!,
        filterName: form.filterName,
        filterPattern: form.filterPattern || undefined,
        metricTransformations: [
          {
            metricName: form.metricName,
            metricNamespace: form.metricNamespace,
            metricValue: form.metricValue,
          },
        ],
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ filterName: "", filterPattern: "", metricName: "", metricNamespace: "", metricValue: "1" });
          showToast("success", `Metric filter ${form.filterName} saved`);
        },
      }
    );
  }

  function handleDelete(filterName: string) {
    deleteFilter.mutateAsync({ logGroupName: group!, filterName }).then(() => {
      showToast("success", `Metric filter ${filterName} deleted`);
    });
  }

  async function handleTest() {
    try {
      const result = await testFilter.mutateAsync({
        filterPattern: testPattern,
        logEventMessages: testMessages.split("\n").map((m) => m.trim()).filter(Boolean),
      });
      setTestResult(result);
    } catch {
      showToast("error", "Metric filter test failed");
    }
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load metric filters"}
        </StatusIndicator>
      )}

      <SpaceBetween size="m">
        <SpaceBetween direction="horizontal" size="xs">
          <Input
            value={groupInput}
            onChange={({ detail }) => setGroupInput(detail.value)}
            placeholder="/aws/lambda/my-function"
            ariaLabel="Log group name for metric filters"
          />
          <Button variant="primary" onClick={handleLoad}>
            Load filters
          </Button>
          <Button onClick={() => setShowCreate(true)} disabled={!group}>
            Create metric filter
          </Button>
          <Button onClick={() => setShowTest(true)}>Test a filter pattern</Button>
        </SpaceBetween>

        <ResourceTable
          resourceName="Metric Filter"
          headerTitle={group ? `Metric Filters for ${group}` : "Metric Filters"}
          headerCounter={group ? data?.total : undefined}
          items={group ? items : []}
          columns={[
            {
              id: "name",
              header: "Filter name",
              cell: (item: any) => item.filterName,
              isRowHeader: true,
            },
            {
              id: "pattern",
              header: "Pattern",
              cell: (item: any) => item.filterPattern || "(all events)",
            },
            {
              id: "transformations",
              header: "Metric transformations",
              cell: (item: any) => item.transformations || "—",
            },
            {
              id: "created",
              header: "Created",
              cell: (item: any) => formatPolicyTime(item.creationTime),
            },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.filterName}
                  resourceType="metric filter"
                  loading={
                    deleteFilter.isPending &&
                    deleteFilter.variables.filterName === item.filterName
                  }
                  onDelete={() => handleDelete(item.filterName)}
                />
              ),
            },
          ]}
          loading={isLoading}
          emptyMessage={group ? "No metric filters for this log group." : "Enter a log group name to list its metric filters."}
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header={`Create Metric Filter for ${group}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putFilter.isPending}
                disabled={!form.filterName || !form.metricName || !form.metricNamespace}
                onClick={handleCreate}
              >
                Create filter
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putFilter.isError && (
            <Alert type="error" dismissible>
              {(putFilter.error as Error)?.message || "Failed to create metric filter"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Filter name">
              <Input
                value={form.filterName}
                onChange={({ detail }) => setForm((p) => ({ ...p, filterName: detail.value }))}
                placeholder="error-count"
              />
            </FormField>
            <FormField label="Filter pattern (optional)">
              <Input
                value={form.filterPattern}
                onChange={({ detail }) => setForm((p) => ({ ...p, filterPattern: detail.value }))}
                placeholder="ERROR"
              />
            </FormField>
            <ColumnLayout columns={3}>
              <FormField label="Metric name">
                <Input
                  value={form.metricName}
                  onChange={({ detail }) => setForm((p) => ({ ...p, metricName: detail.value }))}
                  placeholder="Errors"
                />
              </FormField>
              <FormField label="Metric namespace">
                <Input
                  value={form.metricNamespace}
                  onChange={({ detail }) => setForm((p) => ({ ...p, metricNamespace: detail.value }))}
                  placeholder="MyApp"
                />
              </FormField>
              <FormField label="Metric value">
                <Input
                  value={form.metricValue}
                  onChange={({ detail }) => setForm((p) => ({ ...p, metricValue: detail.value }))}
                />
              </FormField>
            </ColumnLayout>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal
        visible={showTest}
        onDismiss={() => {
          setShowTest(false);
          setTestResult(null);
        }}
        header="Test Metric Filter Pattern"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowTest(false);
                  setTestResult(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                loading={testFilter.isPending}
                disabled={!testPattern}
                onClick={handleTest}
              >
                Test pattern
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Filter pattern">
              <Input
                value={testPattern}
                onChange={({ detail }) => setTestPattern(detail.value)}
                placeholder="ERROR"
              />
            </FormField>
            <FormField
              label="Log event messages"
              description="One message per line. Blank lines are ignored."
            >
              <Textarea
                value={testMessages}
                onChange={({ detail }) => setTestMessages(detail.value)}
                rows={5}
                ariaLabel="Test log event messages"
                placeholder={"ERROR: boom\nINFO: ok"}
              />
            </FormField>
            {testResult && (
              <Container header={<Header variant="h3">{testResult.total} matches</Header>}>
                {testResult.matches.length === 0 ? (
                  <Box color="text-body-secondary">No events matched this pattern.</Box>
                ) : (
                  <Table
                    columnDefinitions={[
                      { id: "eventNumber", header: "#", cell: (m: any) => m.eventNumber },
                      { id: "eventMessage", header: "Message", cell: (m: any) => m.eventMessage },
                      {
                        id: "extractedValues",
                        header: "Extracted values",
                        cell: (m: any) => JSON.stringify(m.extractedValues),
                      },
                    ]}
                    items={testResult.matches}
                    trackBy={(m: any) => m.eventNumber}
                  />
                )}
              </Container>
            )}
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function CloudWatchDestinationsPanel() {
  const { showToast } = useToast();
  const putDestination = usePutDestination();
  const putPolicy = usePutDestinationPolicy();
  const [form, setForm] = useState({ destinationName: "", targetArn: "", roleArn: "" });
  const [policyForm, setPolicyForm] = useState({ destinationName: "", accessPolicy: "" });
  const [lastDestination, setLastDestination] = useState<LogDestination | null>(null);

  function handleCreate() {
    putDestination.mutate(
      {
        destinationName: form.destinationName,
        targetArn: form.targetArn,
        roleArn: form.roleArn || undefined,
      },
      {
        onSuccess: (res) => {
          setLastDestination(res.destination);
          showToast("success", `Destination ${form.destinationName} saved`);
        },
      }
    );
  }

  function handleApplyPolicy() {
    putPolicy.mutate(
      { destinationName: policyForm.destinationName, accessPolicy: policyForm.accessPolicy },
      {
        onSuccess: () => {
          showToast("success", `Access policy attached to ${policyForm.destinationName}`);
          setPolicyForm({ destinationName: "", accessPolicy: "" });
        },
      }
    );
  }

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header
            variant="h2"
            description="Create or update a cross-account subscription destination."
          >
            Destinations
          </Header>
        }
      >
        <SpaceBetween size="m">
          {putDestination.isError && (
            <Alert type="error" dismissible>
              {(putDestination.error as Error)?.message || "Failed to save destination"}
            </Alert>
          )}
          {lastDestination && (
            <Box>
              Saved destination <strong>{lastDestination.destinationName}</strong> —{" "}
              {lastDestination.arn || lastDestination.targetArn}
            </Box>
          )}
          <ColumnLayout columns={3}>
            <FormField label="Destination name">
              <Input
                value={form.destinationName}
                onChange={({ detail }) => setForm((p) => ({ ...p, destinationName: detail.value }))}
                placeholder="my-destination"
              />
            </FormField>
            <FormField label="Target ARN">
              <Input
                value={form.targetArn}
                onChange={({ detail }) => setForm((p) => ({ ...p, targetArn: detail.value }))}
                placeholder="arn:aws:kinesis:us-east-1:..."
              />
            </FormField>
            <FormField label="Role ARN (optional)">
              <Input
                value={form.roleArn}
                onChange={({ detail }) => setForm((p) => ({ ...p, roleArn: detail.value }))}
                placeholder="arn:aws:iam::...:role/..."
              />
            </FormField>
          </ColumnLayout>
          <Button
            variant="primary"
            loading={putDestination.isPending}
            disabled={!form.destinationName || !form.targetArn}
            onClick={handleCreate}
          >
            Save destination
          </Button>
        </SpaceBetween>
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            description="Attach an access policy so other accounts can subscribe to this destination."
          >
            Destination access policy
          </Header>
        }
      >
        <SpaceBetween size="m">
          {putPolicy.isError && (
            <Alert type="error" dismissible>
              {(putPolicy.error as Error)?.message || "Failed to attach access policy"}
            </Alert>
          )}
          <ColumnLayout columns={2}>
            <FormField label="Destination name">
              <Input
                value={policyForm.destinationName}
                onChange={({ detail }) =>
                  setPolicyForm((p) => ({ ...p, destinationName: detail.value }))
                }
                placeholder="my-destination"
              />
            </FormField>
          </ColumnLayout>
          <FormField label="Access policy document">
            <Textarea
              value={policyForm.accessPolicy}
              onChange={({ detail }) =>
                setPolicyForm((p) => ({ ...p, accessPolicy: detail.value }))
              }
              rows={5}
              placeholder='{"Version":"2012-10-17","Statement":[]}'
            />
          </FormField>
          <Button
            variant="primary"
            loading={putPolicy.isPending}
            disabled={!policyForm.destinationName || !policyForm.accessPolicy}
            onClick={handleApplyPolicy}
          >
            Attach access policy
          </Button>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}

function CloudWatchResourcePoliciesPanel() {
  const { showToast } = useToast();
  const { data, isLoading, isError, error } = useResourcePolicies();
  const putPolicy = usePutResourcePolicy();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ policyName: "", policyDocument: "" });

  const items = (data?.resourcePolicies || []).map((p) => ({
    policyName: p.policyName,
    policyDocument: p.policyDocument,
    lastUpdatedTime: p.lastUpdatedTime,
  }));

  function handleCreate() {
    putPolicy.mutate(
      { policyName: form.policyName, policyDocument: form.policyDocument },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ policyName: "", policyDocument: "" });
          showToast("success", `Resource policy ${form.policyName} saved`);
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load resource policies"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Resource Policy"
        headerTitle="Resource Policies"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Policy name",
            cell: (item: any) => item.policyName,
            isRowHeader: true,
          },
          {
            id: "updated",
            header: "Last updated",
            cell: (item: any) => formatPolicyTime(item.lastUpdatedTime),
          },
          {
            id: "document",
            header: "Document",
            cell: (item: any) => (
              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {item.policyDocument}
              </span>
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No resource policies. Create one to get started."
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Put Resource Policy"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={putPolicy.isPending}
                disabled={!form.policyName || !form.policyDocument}
                onClick={handleCreate}
              >
                Save policy
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putPolicy.isError && (
            <Alert type="error" dismissible>
              {(putPolicy.error as Error)?.message || "Failed to save resource policy"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Policy name"
              description="Name that lets a source account put subscription filters against this account."
            >
              <Input
                value={form.policyName}
                onChange={({ detail }) => setForm((p) => ({ ...p, policyName: detail.value }))}
                placeholder="cross-account-subscription"
              />
            </FormField>
            <FormField label="Policy document">
              <Textarea
                value={form.policyDocument}
                onChange={({ detail }) => setForm((p) => ({ ...p, policyDocument: detail.value }))}
                rows={5}
                placeholder='{"Version":"2012-10-17","Statement":[]}'
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function CloudWatchDeletionProtectionPanel() {
  const { showToast } = useToast();
  const putProtection = usePutLogGroupDeletionProtection();
  const [identifier, setIdentifier] = useState("");
  const [enabled, setEnabled] = useState(true);

  function handleApply() {
    putProtection.mutate(
      { logGroupIdentifier: identifier.trim(), deletionProtectionEnabled: enabled },
      {
        onSuccess: () => {
          showToast(
            "success",
            `Deletion protection ${enabled ? "enabled" : "disabled"} for ${identifier.trim()}`
          );
        },
      }
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Prevent a log group from being accidentally deleted. Accepts a log group name or ARN."
        >
          Log group deletion protection
        </Header>
      }
    >
      <SpaceBetween size="m">
        {putProtection.isError && (
          <Alert type="error" dismissible>
            {(putProtection.error as Error)?.message || "Failed to update deletion protection"}
          </Alert>
        )}
        <FormField label="Log group identifier">
          <Input
            value={identifier}
            onChange={({ detail }) => setIdentifier(detail.value)}
            placeholder="/aws/lambda/my-function"
          />
        </FormField>
        <Checkbox
          checked={enabled}
          onChange={({ detail }) => setEnabled(detail.checked)}
          description="When enabled, the log group cannot be deleted until protection is turned off."
        >
          Enable deletion protection
        </Checkbox>
        <Button
          variant="primary"
          loading={putProtection.isPending}
          disabled={!identifier.trim()}
          onClick={handleApply}
        >
          Apply
        </Button>
      </SpaceBetween>
    </Container>
  );
}

const INSIGHTS_TIME_OPTIONS: SelectProps.Option[] = [
  { label: "Last hour", value: "1" },
  { label: "Last 3 hours", value: "3" },
  { label: "Last 24 hours", value: "24" },
];

function CloudWatchInsightsConsole() {
  const { showToast } = useToast();
  const startQuery = useStartQuery();
  const stopQuery = useStopQuery();
  const [logGroupName, setLogGroupName] = useState("");
  const [queryString, setQueryString] = useState("fields @timestamp, @message | limit 20");
  const [timeRange, setTimeRange] = useState<SelectProps.Option>(INSIGHTS_TIME_OPTIONS[0]);
  const [queryId, setQueryId] = useState<string | null>(null);
  const results = useQueryResults(queryId);

  function handleRun() {
    startQuery.mutateAsync({
      logGroupName: logGroupName.trim(),
      startTime: Date.now() - parseInt(timeRange.value as string) * 3_600_000,
      endTime: Date.now(),
      queryString,
    })
      .then((res) => setQueryId(res.queryId))
      .catch((e: Error) => showToast("error", e.message));
  }

  function handleStop() {
    stopQuery.mutateAsync(queryId!).then(() => {
      showToast("success", "Query stopped");
    });
  }

  const rows = results.data?.results || [];
  const fields = rows[0]?.map((f) => f.field) || [];
  const status = results.data?.status;
  const isRunning = status === "Running";

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header
            variant="h2"
            description="Run CloudWatch Logs Insights queries against a log group."
          >
            Logs Insights
          </Header>
        }
      >
        <SpaceBetween size="m">
          <ColumnLayout columns={2}>
            <FormField label="Log group">
              <Input
                value={logGroupName}
                onChange={({ detail }) => setLogGroupName(detail.value)}
                placeholder="/aws/lambda/my-function"
              />
            </FormField>
            <FormField label="Time range">
              <Select
                selectedOption={timeRange}
                onChange={({ detail }) => setTimeRange(detail.selectedOption)}
                options={INSIGHTS_TIME_OPTIONS}
              />
            </FormField>
          </ColumnLayout>
          <FormField label="Query">
            <Textarea
              value={queryString}
              onChange={({ detail }) => setQueryString(detail.value)}
              rows={3}
              placeholder="fields @timestamp, @message | filter @message like /ERROR/ | limit 20"
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              loading={startQuery.isPending}
              disabled={!logGroupName.trim() || !queryString}
              onClick={handleRun}
            >
              Run query
            </Button>
            {queryId && isRunning && (
              <Button loading={stopQuery.isPending} onClick={handleStop}>
                Stop query
              </Button>
            )}
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      {queryId && (
        <Container
          header={
            <Header
              variant="h2"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  {status && <StatusIndicator type={isRunning ? "loading" : "success"}>{status}</StatusIndicator>}
                  <Button iconName="refresh" onClick={() => results.refetch()} loading={results.isLoading}>
                    Refresh
                  </Button>
                </SpaceBetween>
              }
            >
              Results
            </Header>
          }
        >
          <SpaceBetween size="m">
            {results.data && (
              <Box fontSize="body-s" color="text-body-secondary">
                Scanned {results.data.statistics.recordsScanned} records — matched{" "}
                {results.data.statistics.recordsMatched}
              </Box>
            )}
            {rows.length === 0 ? (
              <Box textAlign="center" color="text-body-secondary">
                {isRunning ? "Query is running..." : "No results yet. Run a query to see rows."}
              </Box>
            ) : (
              <Table
                columnDefinitions={fields.map((f) => ({
                  id: f,
                  header: f,
                  cell: (row: any[]) => row.find((c) => c.field === f)?.value ?? "—",
                }))}
                items={rows}
                trackBy={(row: any[]) => JSON.stringify(row)}
              />
            )}
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}

// ─── Log Group List ────────────────────────────────────


function LogsPagination({
  pageIndex,
  total,
  nextToken,
  onPageChange,
  label,
}: {
  pageIndex: number;
  total?: number;
  nextToken?: string;
  onPageChange: (page: number) => void;
  label: string;
}) {
  const knownPages = total && total > 0 ? Math.ceil(total / LOGS_PAGE_SIZE) : pageIndex;
  const pagesCount = Math.max(1, knownPages);
  return (
    <Pagination
      currentPageIndex={pageIndex}
      pagesCount={pagesCount}
      openEnd={!!nextToken && pagesCount <= pageIndex}
      onChange={({ detail }) => onPageChange(detail.currentPageIndex)}
      ariaLabels={{
        nextPageLabel: "Next page",
        previousPageLabel: "Previous page",
        paginationLabel: label,
        pageLabel: (n) => `Page ${n}`,
      }}
    />
  );
}

function CloudWatchLogGroupList({ onSelect }: { onSelect: (name: string) => void }) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageTokens, setPageTokens] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, error } = useLogGroups(undefined, {
    limit: LOGS_PAGE_SIZE,
    nextToken: pageTokens[pageIndex],
    q: query || undefined,
  });
  const createGroup = useCreateLogGroup();
  const deleteGroup = useDeleteLogGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");

  function setSearch(text: string) {
    setQuery(text);
    setPageIndex(1);
    setPageTokens({ 1: undefined });
  }

  useEffect(() => {
    if (data?.nextToken) {
      setPageTokens((tokens) => ({ ...tokens, [pageIndex + 1]: data.nextToken }));
    }
  }, [data?.nextToken, pageIndex]);

  const items = (data?.logGroups || []).map((g) => ({
    logGroupName: g.logGroupName,
    retentionInDays: g.retentionInDays,
    creationTime: g.creationTime,
    storedBytes: g.storedBytes,
    arn: g.arn,
  }));

  function formatRetention(days?: number): string {
    if (!days) return "Never expire";
    if (days === 1) return "1 day";
    if (days === 7) return "7 days";
    if (days === 30) return "30 days";
    if (days === 365) return "1 year";
    return `${days} days`;
  }

  function handleCreate() {
    createGroup.mutate(
      { logGroupName: groupName },
      {
        onSuccess: () => {
          setShowCreate(false);
          setGroupName("");
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load log groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Log Group"
        headerTitle="Log Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Log group name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.logGroupName)}>
                {item.logGroupName}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "retention",
            header: "Retention",
            cell: (item: any) => formatRetention(item.retentionInDays),
          },
          {
            id: "size",
            header: "Stored bytes",
            cell: (item: any) => formatBytes(item.storedBytes ?? 0),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.logGroupName}
                resourceType="log group"
                loading={
                  deleteGroup.isPending && deleteGroup.variables === item.logGroupName
                }
                onDelete={() => deleteGroup.mutateAsync(item.logGroupName)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No log groups found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find log groups by name"
        filteringText={query}
        onFilterChange={setSearch}
        onCreate={() => setShowCreate(true)}
        pagination={
          <LogsPagination
            pageIndex={pageIndex}
            total={data?.total}
            nextToken={data?.nextToken}
            onPageChange={setPageIndex}
            label="Log groups pagination"
          />
        }
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          setGroupName("");
        }}
        header="Create Log Group"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  setGroupName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createGroup.isPending}
                disabled={!groupName}
                onClick={handleCreate}
              >
                Create log group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createGroup.isError && (
            <Alert type="error" dismissible>
              {(createGroup.error as Error)?.message ||
                "Failed to create log group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Log group name"
              description="The name of the log group. Use alphanumeric characters, hyphens, underscores, and forward slashes."
            >
              <Input
                value={groupName}
                onChange={({ detail }) => setGroupName(detail.value)}
                placeholder="/aws/lambda/my-function"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Log Group Detail ──────────────────────────────────


function CloudWatchLogGroupDetail({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState("streams");
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  if (selectedStream) {
    return (
      <CloudWatchLogStreamDetail
        logGroupName={name}
        logStreamName={selectedStream}
        onBack={() => setSelectedStream(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "streams",
      label: "Log Streams",
      content: (
        <CloudWatchLogStreamList
          logGroupName={name}
          onSelect={(s) => setSelectedStream(s)}
        />
      ),
    },
    {
      id: "retention",
      label: "Retention",
      content: <CloudWatchRetentionConfig logGroupName={name} />,
    },
    {
      id: "subscription-filters",
      label: "Subscription Filters",
      content: <CloudWatchSubscriptionFilterList logGroupName={name} />,
    },
    {
      id: "tags",
      label: "Tags",
      content: <CloudWatchLogGroupTags logGroupName={name} />,
    },
    {
      id: "data-protection",
      label: "Data Protection",
      content: <CloudWatchDataProtection logGroupName={name} />,
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Log Groups
      </Button>

      <Header
        variant="h2"
        description="Log group details — streams, retention, subscription filters, and tags"
      >
        {name}
      </Header>

      <Tabs
        activeTabId={selectedTab}
        onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
        tabs={tabs}
      />
    </SpaceBetween>
  );
}

// ─── Log Stream List ───────────────────────────────────


function CloudWatchLogStreamList({
  logGroupName,
  onSelect,
}: {
  logGroupName: string;
  onSelect: (name: string) => void;
}) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageTokens, setPageTokens] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, error } = useLogStreams(logGroupName, undefined, {
    limit: LOGS_PAGE_SIZE,
    nextToken: pageTokens[pageIndex],
    q: query || undefined,
  });
  const createStream = useCreateLogStream();
  const deleteStream = useDeleteLogStream();

  const [showCreate, setShowCreate] = useState(false);
  const [streamName, setStreamName] = useState("");

  function setSearch(text: string) {
    setQuery(text);
    setPageIndex(1);
    setPageTokens({ 1: undefined });
  }

  useEffect(() => {
    setPageIndex(1);
    setPageTokens({ 1: undefined });
    setQuery("");
  }, [logGroupName]);

  useEffect(() => {
    if (data?.nextToken) {
      setPageTokens((tokens) => ({ ...tokens, [pageIndex + 1]: data.nextToken }));
    }
  }, [data?.nextToken, pageIndex]);

  const items = (data?.logStreams || []).map((s) => ({
    logStreamName: s.logStreamName,
    creationTime: s.creationTime,
    lastEventTimestamp: s.lastEventTimestamp,
    storedBytes: s.storedBytes,
    lastIngestionTime: s.lastIngestionTime,
  }));

  function formatTimestamp(ts?: number): string {
    if (!ts) return "—";
    return new Date(ts).toLocaleString();
  }

  function handleCreate() {
    createStream.mutate(
      { logGroupName, logStreamName: streamName },
      {
        onSuccess: () => {
          setShowCreate(false);
          setStreamName("");
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load log streams"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Log Stream"
        headerTitle={`Log Streams for ${logGroupName}`}
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Log stream name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.logStreamName)}>
                {item.logStreamName}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "lastEvent",
            header: "Last event",
            cell: (item: any) => formatTimestamp(item.lastEventTimestamp),
          },
          {
            id: "size",
            header: "Stored bytes",
            cell: (item: any) =>
              item.storedBytes ? `${(item.storedBytes / 1024).toFixed(1)} KB` : "0 B",
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.logStreamName}
                resourceType="log stream"
                loading={
                  deleteStream.isPending &&
                  deleteStream.variables.logStreamName === item.logStreamName
                }
                onDelete={() =>
                  deleteStream.mutateAsync({
                    logGroupName,
                    logStreamName: item.logStreamName,
                  })
                }
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No log streams found"
        filterEnabled
        filterPlaceholder="Find streams by name"
        filteringText={query}
        onFilterChange={setSearch}
        onCreate={() => setShowCreate(true)}
        pagination={
          <LogsPagination
            pageIndex={pageIndex}
            total={data?.total}
            nextToken={data?.nextToken}
            onPageChange={setPageIndex}
            label="Log streams pagination"
          />
        }
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          setStreamName("");
        }}
        header="Create Log Stream"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => {
                  setShowCreate(false);
                  setStreamName("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createStream.isPending}
                disabled={!streamName}
                onClick={handleCreate}
              >
                Create log stream
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createStream.isError && (
            <Alert type="error" dismissible>
              {(createStream.error as Error)?.message ||
                "Failed to create log stream"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Log stream name"
              description="The name of the log stream within this log group."
            >
              <Input
                value={streamName}
                onChange={({ detail }) => setStreamName(detail.value)}
                placeholder="my-stream"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Log Stream Detail (Live Log Viewer) ───────────────


function CloudWatchLogStreamDetail({
  logGroupName,
  logStreamName,
  onBack,
}: {
  logGroupName: string;
  logStreamName: string;
  onBack: () => void;
}) {
  const [limit, setLimit] = useState(LOG_VIEW_LIMIT_OPTIONS[2]); // 500 default
  const [autoRefresh, setAutoRefresh] = useState(true);
  const deleteLogStream = useDeleteLogStream();

  // Filter-pattern search state. `filterInput` is the live text box; `appliedFilter`
  // is the committed pattern that actually drives the search (set on Search / Enter,
  // emptied on Clear). A non-empty applied filter switches the view into search mode.
  const [filterInput, setFilterInput] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [timeRange, setTimeRange] = useState(TIME_RANGE_OPTIONS[2]); // Last 1 hour
  const isSearchMode = appliedFilter.trim().length > 0;

  const limitNum = parseInt(limit.value!);
  const startTimeOffsetMs =
    timeRange.value && timeRange.value !== "0"
      ? parseInt(timeRange.value as string)
      : undefined;

  const { data, isLoading, isError, error, refetch } = useLogEvents(
    logGroupName,
    logStreamName,
    {
      limit: limitNum,
      startFromHead: false,
    },
    autoRefresh && !isSearchMode
  );

  const filtered = useFilteredLogEvents(
    logGroupName,
    logStreamName,
    { filterPattern: appliedFilter, startTimeOffsetMs, limit: limitNum },
    autoRefresh
  );

  // Auto-refresh toggle
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const activeData = isSearchMode ? filtered.data : data;
  const activeError = isSearchMode ? filtered.error : error;
  const isActiveError = isSearchMode ? filtered.isError : isError;
  const isActiveLoading = isSearchMode ? filtered.isLoading : isLoading;

  useEffect(() => {
    if (autoScroll && !isSearchMode && eventsContainerRef.current) {
      eventsContainerRef.current.scrollTop = eventsContainerRef.current.scrollHeight;
    }
  }, [activeData?.events, autoScroll, isSearchMode]);

  const events = (activeData?.events || []).slice().reverse(); // newest first

  // When a search returns nothing within a bounded window, the events may simply be
  // older than the window (live-tail ignores time, so they can still show there).
  // Nudge the user to widen the range rather than assume there's no match at all.
  const searchEmptyMessage = startTimeOffsetMs
    ? `No events matched this filter within ${timeRange.label} — widen the time range to search further back.`
    : "No events matched this filter.";

  function handleSearch() {
    setAppliedFilter(filterInput.trim());
    setAutoScroll(false);
  }

  function handleClearSearch() {
    setFilterInput("");
    setAppliedFilter("");
  }

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to Log Streams
      </Button>

      <Header
        variant="h2"
        description={`${logGroupName} > ${logStreamName}`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Select
              selectedOption={limit}
              onChange={({ detail }) => setLimit(detail.selectedOption)}
              options={LOG_VIEW_LIMIT_OPTIONS}
              ariaLabel="Events limit"
            />
            <Button
              iconName="refresh"
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "primary" : "normal"}
              iconName={autoRefresh ? "undo" : "refresh"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              variant="normal"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
            </Button>
            <DeleteButton
              itemName={logStreamName}
              resourceType="log stream"
              loading={
                deleteLogStream.isPending &&
                deleteLogStream.variables.logStreamName === logStreamName
              }
              onDelete={() =>
                deleteLogStream
                  .mutateAsync({ logGroupName, logStreamName })
                  .then(() => onBack())
              }
            />
          </SpaceBetween>
        }
      >
        Log Events
      </Header>

      <Container>
        <SpaceBetween size="xs">
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <Input
                value={filterInput}
                onChange={({ detail }) => setFilterInput(detail.value)}
                onKeyDown={({ detail }) => {
                  if (detail.key === "Enter") handleSearch();
                }}
                placeholder={"Search log events — e.g. Application startup complete"}
                ariaLabel="Filter pattern"
                type="search"
              />
            </div>
            <Select
              selectedOption={timeRange}
              onChange={({ detail }) => setTimeRange(detail.selectedOption)}
              options={TIME_RANGE_OPTIONS}
              ariaLabel="Time range"
            />
            <Button variant="primary" onClick={handleSearch}>
              Search
            </Button>
            {isSearchMode && (
              <Button variant="normal" iconName="close" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </div>
          <Box fontSize="body-s" color="text-body-secondary">
            {isSearchMode
              ? `Searching this stream (${timeRange.label}) — case-sensitive substring match.`
              : 'Case-sensitive substring match — type any word or phrase (e.g. Application startup complete). Floci matches the literal text; CloudWatch operators like ?A ?B and { $.level = "ERROR" } are not supported.'}
          </Box>
        </SpaceBetween>
      </Container>

      {isActiveError && (
        <Alert type="error" dismissible>
          {(activeError as Error)?.message || "Failed to load log events"}
        </Alert>
      )}

      {isActiveLoading && events.length === 0 && (
        <StatusIndicator type="loading">Loading log events...</StatusIndicator>
      )}

      {events.length === 0 && !isActiveLoading && !isActiveError && (
        <Box textAlign="center" padding="xl" color="text-body-secondary">
          {isSearchMode ? searchEmptyMessage : "No log events found for this stream."}
        </Box>
      )}

      <div
        ref={eventsContainerRef}
        style={{
          maxHeight: "600px",
          overflowY: "auto",
          backgroundColor: "var(--color-background-container-content, #ffffff)",
          border: "1px solid var(--color-border-divider-default, #e9ebed)",
          borderRadius: "4px",
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
          fontSize: "12px",
          lineHeight: "1.6",
        }}
        onScroll={() => {
          const el = eventsContainerRef.current!;
          const atBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          if (!atBottom) setAutoScroll(false);
        }}
      >
        {events.map((event: any, idx: number) => (
          <div
            key={event.eventId || idx}
            style={{
              display: "flex",
              padding: "2px 8px",
              borderBottom:
                "1px solid var(--color-border-divider-default, #1a2a3a)",
            }}
          >
            <span
              style={{
                color: "var(--color-text-link-default, #0073bb)",
                minWidth: "140px",
                flexShrink: 0,
                userSelect: "none",
              }}
            >
              {event.timestamp
                ? new Date(event.timestamp).toISOString()
                : "—"}
            </span>
            <span
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color: "var(--color-text-body-default, #16191f)",
              }}
            >
              {event.message}
            </span>
          </div>
        ))}
      </div>

      {isActiveLoading && events.length > 0 && (
        <StatusIndicator type="loading">Refreshing events...</StatusIndicator>
      )}

      {activeData && (
        <Box textAlign="center" fontSize="body-s" color="text-body-secondary">
          {events.length} events displayed
        </Box>
      )}
    </SpaceBetween>
  );
}

// ─── Retention Config ──────────────────────────────────


function CloudWatchRetentionConfig({ logGroupName }: { logGroupName: string }) {
  const { data, isLoading } = useLogGroups();
  const putRetention = usePutRetentionPolicy();
  const deleteRetention = useDeleteRetentionPolicy();

  const logGroup = (data?.logGroups || []).find(
    (g) => g.logGroupName === logGroupName
  );

  const currentRetention = logGroup?.retentionInDays;
  const [selectedRetention, setSelectedRetention] = useState<SelectProps.Option>(
    currentRetention
      ? RETENTION_OPTIONS.find((o) => o.value === String(currentRetention)) ||
          { label: `${currentRetention} days`, value: String(currentRetention) }
      : RETENTION_OPTIONS[RETENTION_OPTIONS.length - 1] // Never expire
  );

  useEffect(() => {
    if (logGroup?.retentionInDays !== undefined) {
      const found = RETENTION_OPTIONS.find(
        (o) => o.value === String(logGroup.retentionInDays)
      );
      if (found) setSelectedRetention(found);
    }
  }, [logGroup?.retentionInDays]);

  if (isLoading) {
    return <StatusIndicator type="loading">Loading retention settings...</StatusIndicator>;
  }

  return (
    <SpaceBetween size="m">
      <Box variant="p">
        <strong>Current retention:</strong>{" "}
        {currentRetention ? `${currentRetention} days` : "Never expire"}
      </Box>

      <FormField
        label="Retention period"
        description="Number of days to retain log events. Setting 'Never expire' removes the retention policy."
      >
        <Select
          selectedOption={selectedRetention}
          onChange={({ detail }) => setSelectedRetention(detail.selectedOption)}
          options={RETENTION_OPTIONS}
        />
      </FormField>

      {putRetention.isError && (
        <Alert type="error" dismissible>
          {(putRetention.error as Error)?.message ||
            "Failed to update retention policy"}
        </Alert>
      )}

      <SpaceBetween direction="horizontal" size="xs">
        <Button
          variant="primary"
          loading={putRetention.isPending}
          disabled={!selectedRetention.value}
          onClick={() => {
            const days = parseInt(selectedRetention.value as string);
            if (days === 0) {
              deleteRetention.mutate(logGroupName);
            } else {
              putRetention.mutate({
                logGroupName,
                retentionInDays: days,
              });
            }
          }}
        >
          Save retention
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}

// ─── Subscription Filters ──────────────────────────────


function CloudWatchSubscriptionFilterList({
  logGroupName,
}: {
  logGroupName: string;
}) {
  const { data, isLoading, isError, error } = useSubscriptionFilters(logGroupName);
  const putFilter = usePutSubscriptionFilter();
  const deleteFilter = useDeleteSubscriptionFilter();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    filterName: "",
    filterPattern: "",
    destinationArn: "",
    distribution: "",
  });

  const items = (data?.subscriptionFilters || []).map((f) => ({
    filterName: f.filterName,
    filterPattern: f.filterPattern,
    destinationArn: f.destinationArn,
    distribution: f.distribution,
    creationTime: f.creationTime,
    roleArn: f.roleArn,
  }));

  function resetForm() {
    setForm({ filterName: "", filterPattern: "", destinationArn: "", distribution: "" });
  }

  function handleCreate() {
    putFilter.mutate(
      {
        logGroupName,
        filterName: form.filterName,
        filterPattern: form.filterPattern || undefined,
        destinationArn: form.destinationArn,
        distribution: form.distribution || undefined,
      },
      { onSuccess: () => { setShowCreate(false); resetForm(); } }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load subscription filters"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Subscription Filter"
        headerTitle="Subscription Filters"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Filter name",
            cell: (item: any) => item.filterName,
            isRowHeader: true,
          },
          {
            id: "destination",
            header: "Destination ARN",
            cell: (item: any) => (
              <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                {item.destinationArn}
              </span>
            ),
          },
          {
            id: "pattern",
            header: "Pattern",
            cell: (item: any) => item.filterPattern || "(all events)",
          },
          {
            id: "distribution",
            header: "Distribution",
            cell: (item: any) => item.distribution || "ByLogStream",
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.filterName}
                resourceType="subscription filter"
                loading={
                  deleteFilter.isPending &&
                  deleteFilter.variables.filterName === item.filterName
                }
                onDelete={() =>
                  deleteFilter.mutateAsync({
                    logGroupName,
                    filterName: item.filterName,
                  })
                }
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No subscription filters"
        filterEnabled
        filterPlaceholder="Find filters by name"
        filterFunction={(item: any, searchText: string) =>
          item.filterName.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create Subscription Filter"
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
                loading={putFilter.isPending}
                disabled={!form.filterName || !form.destinationArn}
                onClick={handleCreate}
              >
                Create filter
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putFilter.isError && (
            <Alert type="error" dismissible>
              {(putFilter.error as Error)?.message ||
                "Failed to create subscription filter"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Filter name"
              description="A name for this subscription filter."
            >
              <Input
                value={form.filterName}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, filterName: detail.value }))
                }
                placeholder="my-filter"
              />
            </FormField>
            <FormField
              label="Destination ARN"
              description="The ARN of the destination (Lambda, Kinesis, or Firehose)."
            >
              <Input
                value={form.destinationArn}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, destinationArn: detail.value }))
                }
                placeholder="arn:aws:lambda:us-east-1:..."
              />
            </FormField>
            <FormField
              label="Filter pattern (optional)"
              description="A filter pattern for matching log events. Leave empty to match all events."
            >
              <Input
                value={form.filterPattern}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, filterPattern: detail.value }))
                }
                placeholder='?ERROR ?WARN'
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}// ─── Data Protection Policy ────────────────────────────
function CloudWatchDataProtection({ logGroupName }: { logGroupName: string }) {
  const { data, isLoading } = useDataProtectionPolicy(logGroupName);

  if (isLoading) return <Spinner />;

  const policyDoc = (data as any)?.policyDocument;
  let parsed: any = null;
  try {
    parsed = policyDoc ? JSON.parse(policyDoc) : null;
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return (
      <Box>
        <StatusIndicator type="info">No data protection policy configured for this log group.</StatusIndicator>
      </Box>
    );
  }

  return (
    <SpaceBetween size="m">
      <Header variant="h3">Data Protection Policy</Header>
      <Container>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13 }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </Container>
    </SpaceBetween>
  );
}

// ─── Log Group Tags ────────────────────────────────────
function CloudWatchLogGroupTags({ logGroupName }: { logGroupName: string }) {
  const { data, isLoading, isError, error } = useLogGroupTags(logGroupName);
  const tagMutation = useTagLogGroup();
  const untagMutation = useUntagLogGroup();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const tags = data?.tags || {};
  const tagEntries = Object.entries(tags).map(([key, value]) => ({ key, value }));

  function handleAddTag() {
    const updated = { ...tags, [newKey]: newValue };
    tagMutation.mutate(
      { logGroupName, tags: updated },
      { onSuccess: () => { setNewKey(""); setNewValue(""); } }
    );
  }

  function handleRemoveTag(key: string) {
    untagMutation.mutate({ logGroupName, tags: [key] });
  }

  if (isLoading) {
    return <StatusIndicator type="loading">Loading tags...</StatusIndicator>;
  }

  if (isError) {
    return (
      <StatusIndicator type="error">
        {(error as Error)?.message || "Failed to load tags"}
      </StatusIndicator>
    );
  }

  return (
    <SpaceBetween size="m">
      {tagEntries.length === 0 && (
        <Box color="text-body-secondary">No tags associated with this log group.</Box>
      )}

      {tagEntries.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--color-border-divider-default, #eaeded)",
              }}
            >
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Key</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Value</th>
              <th style={{ padding: "8px 12px", width: "60px" }}></th>
            </tr>
          </thead>
          <tbody>
            {tagEntries.map(({ key, value }) => (
              <tr
                key={key}
                style={{
                  borderBottom:
                    "1px solid var(--color-border-divider-default, #eaeded)",
                }}
              >
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{key}</td>
                <td style={{ padding: "8px 12px" }}>{value}</td>
                <td style={{ padding: "8px 12px" }}>
                  <Button
                    variant="icon"
                    iconName="remove"
                    ariaLabel={`Remove tag ${key}`}
                    loading={untagMutation.isPending}
                    onClick={() => handleRemoveTag(key)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SpaceBetween direction="horizontal" size="xs">
        <FormField label="Key">
          <Input
            value={newKey}
            onChange={({ detail }) => setNewKey(detail.value)}
            placeholder="tag-key"
          />
        </FormField>
        <FormField label="Value">
          <Input
            value={newValue}
            onChange={({ detail }) => setNewValue(detail.value)}
            placeholder="tag-value"
          />
        </FormField>
        <Button
          variant="primary"
          loading={tagMutation.isPending}
          disabled={!newKey}
          onClick={handleAddTag}
        >
          Add tag
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}

// ─── Cluster Parameter Group List ──────────────────────


const RETENTION_OPTIONS: SelectProps.Option[] = [
  { label: "1 day", value: "1" },
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
  { label: "120 days", value: "120" },
  { label: "150 days", value: "150" },
  { label: "180 days", value: "180" },
  { label: "365 days", value: "365" },
  { label: "400 days", value: "400" },
  { label: "545 days", value: "545" },
  { label: "731 days", value: "731" },
  { label: "1827 days", value: "1827" },
  { label: "3653 days", value: "3653" },
  { label: "Never expire", value: "0" },
];

const LOG_VIEW_LIMIT_OPTIONS: SelectProps.Option[] = [
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "500", value: "500" },
  { label: "1000", value: "1000" },
  { label: "10000", value: "10000" },
];

// Relative time-range presets for filter-pattern search. `value` is the window size in
// milliseconds; "0" means all time (no startTime bound).
const TIME_RANGE_OPTIONS: SelectProps.Option[] = [
  { label: "Last 5 minutes", value: String(5 * 60 * 1000) },
  { label: "Last 15 minutes", value: String(15 * 60 * 1000) },
  { label: "Last 1 hour", value: String(60 * 60 * 1000) },
  { label: "Last 3 hours", value: String(3 * 60 * 60 * 1000) },
  { label: "Last 12 hours", value: String(12 * 60 * 60 * 1000) },
  { label: "Last 24 hours", value: String(24 * 60 * 60 * 1000) },
  { label: "All time", value: "0" },
];
