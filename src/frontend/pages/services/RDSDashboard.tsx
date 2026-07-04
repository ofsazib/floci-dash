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
import PropertyTable from "../../components/PropertyTable";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
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

export function RDSDashboard() {
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  if (selectedInstance) {
    return (
      <RDSDBInstanceDetail
        id={selectedInstance}
        onBack={() => setSelectedInstance(null)}
      />
    );
  }

  if (selectedCluster) {
    return (
      <RDSDBClusterDetail
        id={selectedCluster}
        onBack={() => setSelectedCluster(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "db-instances",
      label: "DB Instances",
      content: <RDSDBInstanceList onSelect={(id) => setSelectedInstance(id)} />,
    },
    {
      id: "db-clusters",
      label: "DB Clusters",
      content: <RDSDBClusterList onSelect={(id) => setSelectedCluster(id)} />,
    },
    {
      id: "parameter-groups",
      label: "Parameter Groups",
      content: <RDSParameterGroupList />,
    },
    {
      id: "cluster-parameter-groups",
      label: "Cluster Parameter Groups",
      content: <RDSClusterParameterGroupList />,
    },
  ];

  return (
    <ServiceDashboardLayout
      tabs={tabs}
      defaultActiveTab="db-instances"
    />
  );
}

// ─── DB Instance List ──────────────────────────────────


function RDSDBInstanceList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, error } = useRDSDBInstances();
  const deleteInstance = useRDSDeleteDBInstance();
  const rebootInstance = useRDSRebootDBInstance();
  const createInstance = useRDSCreateDBInstance();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    dbInstanceIdentifier: "",
    engine: ENGINE_OPTIONS[0],
    dbInstanceClass: DB_CLASS_OPTIONS[0],
    masterUsername: "admin",
    masterPassword: "password",
    allocatedStorage: "20",
    dbName: "",
    engineVersion: "",
  });

  const items = (data?.instances || []).map((i) => ({
    id: i.id,
    engine: i.engine,
    engineVersion: i.engineVersion,
    status: i.status,
    dbInstanceClass: i.dbInstanceClass,
    allocatedStorage: i.allocatedStorage,
    masterUsername: i.masterUsername,
    endpoint: i.endpoint,
  }));

  function resetForm() {
    setForm({
      dbInstanceIdentifier: "",
      engine: ENGINE_OPTIONS[0],
      dbInstanceClass: DB_CLASS_OPTIONS[0],
      masterUsername: "admin",
      masterPassword: "password",
      allocatedStorage: "20",
      dbName: "",
      engineVersion: "",
    });
  }

  function handleCreate() {
    if (!form.dbInstanceIdentifier) return;
    createInstance.mutate(
      {
        dbInstanceIdentifier: form.dbInstanceIdentifier,
        engine: form.engine.value,
        dbInstanceClass: form.dbInstanceClass.value,
        masterUsername: form.masterUsername,
        masterPassword: form.masterPassword,
        allocatedStorage: parseInt(form.allocatedStorage) || 20,
        dbName: form.dbName || undefined,
        engineVersion: form.engineVersion || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load DB instances"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="DB Instance"
        headerTitle="DB Instances"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "Identifier",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.id)}>
                {item.id}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "engine",
            header: "Engine",
            cell: (item: any) => item.engine,
          },
          {
            id: "class",
            header: "Class",
            cell: (item: any) => item.dbInstanceClass,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "available"
                    ? "success"
                    : item.status === "creating" || item.status === "rebooting"
                    ? "in-progress"
                    : "warning"
                }
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="icon"
                  iconName="refresh"
                  ariaLabel={`Reboot ${item.id}`}
                  loading={
                    rebootInstance.isPending &&
                    rebootInstance.variables === item.id
                  }
                  onClick={() => rebootInstance.mutate(item.id)}
                />
                <DeleteButton
                  itemName={item.id}
                  resourceType="DB instance"
                  loading={
                    deleteInstance.isPending &&
                    deleteInstance.variables === item.id
                  }
                  onDelete={() => deleteInstance.mutateAsync(item.id)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No DB instances found"
        filterEnabled
        filterPlaceholder="Find instances by identifier"
        filterFunction={(item: any, searchText: string) =>
          item.id.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create DB Instance"
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
                loading={createInstance.isPending}
                disabled={!form.dbInstanceIdentifier}
                onClick={handleCreate}
              >
                Create instance
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createInstance.isError && (
            <Alert type="error" dismissible>
              {(createInstance.error as Error)?.message ||
                "Failed to create DB instance"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="DB instance identifier"
              description="Must be unique. Use lowercase letters, hyphens, and numbers."
            >
              <Input
                value={form.dbInstanceIdentifier}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, dbInstanceIdentifier: detail.value }))
                }
                placeholder="my-database"
              />
            </FormField>
            <FormField label="Engine">
              <Select
                selectedOption={form.engine}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engine: detail.selectedOption }))
                }
                options={ENGINE_OPTIONS}
              />
            </FormField>
            <FormField label="DB instance class">
              <Select
                selectedOption={form.dbInstanceClass}
                onChange={({ detail }) =>
                  setForm((p) => ({
                    ...p,
                    dbInstanceClass: detail.selectedOption,
                  }))
                }
                options={DB_CLASS_OPTIONS}
              />
            </FormField>
            <FormField
              label="Master username"
              description="Default: admin"
            >
              <Input
                value={form.masterUsername}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterUsername: detail.value }))
                }
              />
            </FormField>
            <FormField
              label="Master password"
              description="Default: password"
            >
              <Input
                type="password"
                value={form.masterPassword}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterPassword: detail.value }))
                }
              />
            </FormField>
            <FormField
              label="Allocated storage (GB)"
              description="Default: 20 GB"
            >
              <Input
                type="number"
                value={form.allocatedStorage}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, allocatedStorage: detail.value }))
                }
              />
            </FormField>
            <FormField
              label="Initial database name (optional)"
            >
              <Input
                value={form.dbName}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, dbName: detail.value }))
                }
                placeholder="mydb"
              />
            </FormField>
            <FormField
              label="Engine version (optional)"
            >
              <Input
                value={form.engineVersion}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engineVersion: detail.value }))
                }
                placeholder="16.4"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── DB Instance Detail ────────────────────────────────


function RDSDBInstanceDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useRDSDBInstance(id);
  const rebootInstance = useRDSRebootDBInstance();
  const deleteInstance = useRDSDeleteDBInstance();

  if (isLoading) return <StatusIndicator type="loading">Loading instance details...</StatusIndicator>;

  if (isError) {
    return (
      <StatusIndicator type="error">
        {(error as Error)?.message || "Failed to load instance details"}
      </StatusIndicator>
    );
  }

  if (!data) return null;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to DB Instances
      </Button>

      <Header
        variant="h2"
        description={`${data.engine} ${data.engineVersion || ""} — ${data.dbInstanceClass}`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              iconName="refresh"
              loading={rebootInstance.isPending}
              onClick={() => rebootInstance.mutate(id)}
            >
              Reboot
            </Button>
            <DeleteButton
              itemName={id}
              resourceType="DB instance"
              loading={
                deleteInstance.isPending && deleteInstance.variables === id
              }
              onDelete={() => deleteInstance.mutateAsync(id).then(() => onBack())}
            />
          </SpaceBetween>
        }
      >
        {data.id}
      </Header>

      <PropertyTable
        items={[
          { label: "Status", value: data.status },
          { label: "Engine", value: `${data.engine} ${data.engineVersion || ""}` },
          { label: "Instance class", value: data.dbInstanceClass },
          { label: "Allocated storage", value: `${data.allocatedStorage} GB` },
          { label: "Master username", value: data.masterUsername },
          { label: "Endpoint", value: data.endpoint ? `${data.endpoint.address}:${data.endpoint.port}` : "N/A" },
          { label: "Database name", value: data.dbName || "N/A" },
          { label: "Cluster", value: data.dbClusterIdentifier || "Standalone" },
          { label: "Parameter group", value: data.parameterGroupName || "default" },
          { label: "Publicly accessible", value: data.publiclyAccessible ? "Yes" : "No" },
          { label: "Multi-AZ", value: data.multiAZ ? "Yes" : "No" },
          { label: "Storage type", value: data.storageType },
          { label: "Backup retention", value: `${data.backupRetentionPeriod} days` },
          { label: "Auto minor version upgrade", value: data.autoMinorVersionUpgrade ? "Enabled" : "Disabled" },
          { label: "IAM auth", value: data.iamDatabaseAuthenticationEnabled ? "Enabled" : "Disabled" },
          { label: "Copy tags to snapshots", value: data.copyTagsToSnapshot ? "Yes" : "No" },
          { label: "ARN", value: data.arn || "N/A" },
        ]}
      />
    </SpaceBetween>
  );
}

// ─── DB Cluster List ───────────────────────────────────


function RDSDBClusterList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, error } = useRDSDBClusters();
  const deleteCluster = useRDSDeleteDBCluster();
  const createCluster = useRDSCreateDBCluster();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    dbClusterIdentifier: "",
    engine: AURORA_ENGINE_OPTIONS[0],
    engineVersion: "",
    masterUsername: "admin",
    masterPassword: "password",
    databaseName: "",
  });

  const items = (data?.clusters || []).map((c) => ({
    id: c.id,
    engine: c.engine,
    engineVersion: c.engineVersion,
    status: c.status,
    masterUsername: c.masterUsername,
    databaseName: c.databaseName,
    endpoint: c.endpoint,
    memberCount: c.clusterMembers.length,
  }));

  function resetForm() {
    setForm({
      dbClusterIdentifier: "",
      engine: AURORA_ENGINE_OPTIONS[0],
      engineVersion: "",
      masterUsername: "admin",
      masterPassword: "password",
      databaseName: "",
    });
  }

  function handleCreate() {
    if (!form.dbClusterIdentifier) return;
    createCluster.mutate(
      {
        dbClusterIdentifier: form.dbClusterIdentifier,
        engine: form.engine.value,
        engineVersion: form.engineVersion || undefined,
        masterUsername: form.masterUsername,
        masterPassword: form.masterPassword,
        databaseName: form.databaseName || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load DB clusters"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="DB Cluster"
        headerTitle="DB Clusters"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "id",
            header: "Identifier",
            cell: (item: any) => (
              <Button variant="link" onClick={() => onSelect(item.id)}>
                {item.id}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "engine",
            header: "Engine",
            cell: (item: any) => `${item.engine} ${item.engineVersion || ""}`,
          },
          {
            id: "status",
            header: "Status",
            cell: (item: any) => (
              <StatusIndicator
                type={
                  item.status === "available"
                    ? "success"
                    : item.status === "creating"
                    ? "in-progress"
                    : "warning"
                }
              >
                {item.status}
              </StatusIndicator>
            ),
          },
          {
            id: "members",
            header: "Members",
            cell: (item: any) => item.memberCount,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="DB cluster"
                loading={
                  deleteCluster.isPending && deleteCluster.variables === item.id
                }
                onDelete={() => deleteCluster.mutateAsync(item.id)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No DB clusters found"
        filterEnabled
        filterPlaceholder="Find clusters by identifier"
        filterFunction={(item: any, searchText: string) =>
          item.id.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create DB Cluster"
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
                loading={createCluster.isPending}
                disabled={!form.dbClusterIdentifier}
                onClick={handleCreate}
              >
                Create cluster
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createCluster.isError && (
            <Alert type="error" dismissible>
              {(createCluster.error as Error)?.message ||
                "Failed to create DB cluster"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="DB cluster identifier"
              description="Must be unique. Use lowercase letters, hyphens, and numbers."
            >
              <Input
                value={form.dbClusterIdentifier}
                onChange={({ detail }) =>
                  setForm((p) => ({
                    ...p,
                    dbClusterIdentifier: detail.value,
                  }))
                }
                placeholder="my-cluster"
              />
            </FormField>
            <FormField label="Engine">
              <Select
                selectedOption={form.engine}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engine: detail.selectedOption }))
                }
                options={AURORA_ENGINE_OPTIONS}
              />
            </FormField>
            <FormField label="Engine version (optional)">
              <Input
                value={form.engineVersion}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, engineVersion: detail.value }))
                }
                placeholder="16.4"
              />
            </FormField>
            <FormField label="Master username">
              <Input
                value={form.masterUsername}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterUsername: detail.value }))
                }
              />
            </FormField>
            <FormField label="Master password">
              <Input
                type="password"
                value={form.masterPassword}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, masterPassword: detail.value }))
                }
              />
            </FormField>
            <FormField label="Initial database name (optional)">
              <Input
                value={form.databaseName}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, databaseName: detail.value }))
                }
                placeholder="mydb"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── DB Cluster Detail ─────────────────────────────────


function RDSDBClusterDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useRDSDBCluster(id);
  const deleteCluster = useRDSDeleteDBCluster();

  if (isLoading) return <StatusIndicator type="loading">Loading cluster details...</StatusIndicator>;

  if (isError) {
    return (
      <StatusIndicator type="error">
        {(error as Error)?.message || "Failed to load cluster details"}
      </StatusIndicator>
    );
  }

  if (!data) return null;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to DB Clusters
      </Button>

      <Header
        variant="h2"
        description={`${data.engine} ${data.engineVersion || ""}`}
        actions={
          <DeleteButton
            itemName={id}
            resourceType="DB cluster"
            loading={deleteCluster.isPending && deleteCluster.variables === id}
            onDelete={() => deleteCluster.mutateAsync(id).then(() => onBack())}
          />
        }
      >
        {data.id}
      </Header>

      <PropertyTable
        items={[
          { label: "Status", value: data.status },
          { label: "Engine", value: `${data.engine} ${data.engineVersion || ""}` },
          { label: "Master username", value: data.masterUsername },
          { label: "Database name", value: data.databaseName || "N/A" },
          { label: "Endpoint", value: data.endpoint || "N/A" },
          { label: "Reader endpoint", value: data.readerEndpoint || "N/A" },
          { label: "Port", value: data.port?.toString() || "N/A" },
          { label: "Parameter group", value: data.parameterGroupName || "default" },
          { label: "Cluster members", value: data.clusterMembers.length > 0 ? data.clusterMembers.join(", ") : "None" },
          { label: "IAM auth", value: data.iamDatabaseAuthenticationEnabled ? "Enabled" : "Disabled" },
          { label: "Allocated storage", value: data.allocatedStorage ? `${data.allocatedStorage} GB` : "N/A" },
          { label: "Backup retention", value: data.backupRetentionPeriod ? `${data.backupRetentionPeriod} days` : "N/A" },
          { label: "Copy tags to snapshots", value: data.copyTagsToSnapshot ? "Yes" : "No" },
          { label: "ARN", value: data.arn || "N/A" },
        ]}
      />
    </SpaceBetween>
  );
}

// ─── Parameter Group List ──────────────────────────────


function RDSParameterGroupList() {
  const { data, isLoading, isError, error } = useRDSParameterGroups();
  const createPG = useRDSCreateParameterGroup();
  const deletePG = useRDSDeleteParameterGroup();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    family: PG_FAMILY_OPTIONS[0],
    description: "",
  });

  const items = (data?.parameterGroups || []).map((g) => ({
    name: g.name,
    family: g.family,
    description: g.description,
  }));

  function resetForm() {
    setForm({ name: "", family: PG_FAMILY_OPTIONS[0], description: "" });
  }

  function handleCreate() {
    if (!form.name) return;
    createPG.mutate(
      {
        dbParameterGroupName: form.name,
        dbParameterGroupFamily: form.family.value,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  // Show parameters for selected group
  if (selectedGroup) {
    return (
      <RDSParameterGroupParametersView
        name={selectedGroup}
        type="parameter-group"
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load parameter groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Parameter Group"
        headerTitle="Parameter Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => setSelectedGroup(item.name)}>
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "family",
            header: "Family",
            cell: (item: any) => item.family,
          },
          {
            id: "description",
            header: "Description",
            cell: (item: any) => item.description,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="parameter group"
                loading={
                  deletePG.isPending && deletePG.variables === item.name
                }
                onDelete={() => deletePG.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No parameter groups found"
        filterEnabled
        filterPlaceholder="Find groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create Parameter Group"
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
                loading={createPG.isPending}
                disabled={!form.name}
                onClick={handleCreate}
              >
                Create group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createPG.isError && (
            <Alert type="error" dismissible>
              {(createPG.error as Error)?.message ||
                "Failed to create parameter group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Parameter group name"
              description="Must be unique within your account."
            >
              <Input
                value={form.name}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, name: detail.value }))
                }
                placeholder="my-params"
              />
            </FormField>
            <FormField label="Parameter group family">
              <Select
                selectedOption={form.family}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, family: detail.selectedOption }))
                }
                options={PG_FAMILY_OPTIONS}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, description: detail.value }))
                }
                placeholder="My custom parameter group"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── Parameter Group Parameters View ───────────────────


function RDSParameterGroupParametersView({
  name,
  type,
  onBack,
}: {
  name: string;
  type: "parameter-group" | "cluster-parameter-group";
  onBack: () => void;
}) {
  const isCluster = type === "cluster-parameter-group";
  const paramsQueryKey = isCluster
    ? ["aws", "rds", "cluster-parameter-group", name, "parameters"]
    : ["aws", "rds", "parameter-group", name, "parameters"];

  const { data, isLoading, isError, error } = useQuery<ParameterListResponse>({
    queryKey: paramsQueryKey,
    queryFn: () =>
      api(
        isCluster
          ? `/aws/rds/cluster-parameter-groups/${name}/parameters`
          : `/aws/rds/parameter-groups/${name}/parameters`
      ),
    enabled: !!name,
  });

  const modifyParams = useRDSModifyParameterGroupParameters();

  const [editParam, setEditParam] = useState<{
    parameterName: string;
    parameterValue: string;
  } | null>(null);

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to {isCluster ? "Cluster " : ""}Parameter Groups
      </Button>

      <Header
        variant="h2"
        description={`${isCluster ? "Cluster " : ""}Parameter group: ${name}`}
      >
        Parameters
      </Header>

      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load parameters"}
        </StatusIndicator>
      )}

      {data && (
        <ResourceTable
          resourceName="Parameter"
          items={data.parameters}
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (item: any) => item.name,
              isRowHeader: true,
            },
            {
              id: "value",
              header: "Value",
              cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <span>{item.value || "(not set)"}</span>
                  {item.isModifiable && (
                    <Button
                      variant="inline-icon"
                      iconName="edit"
                      ariaLabel={`Edit ${item.name}`}
                      onClick={() =>
                        setEditParam({
                          parameterName: item.name,
                          parameterValue: item.value || "",
                        })
                      }
                    />
                  )}
                </SpaceBetween>
              ),
            },
            {
              id: "type",
              header: "Type",
              cell: (item: any) => item.applyType || "static",
            },
            {
              id: "source",
              header: "Source",
              cell: (item: any) => item.source || "engine-default",
            },
            {
              id: "modifiable",
              header: "Modifiable",
              cell: (item: any) =>
                item.isModifiable ? "Yes" : "No",
            },
          ]}
          loading={isLoading}
          emptyMessage="No parameters found"
          filterEnabled
          filterPlaceholder="Find parameters by name"
        />
      )}

      <Modal
        visible={editParam !== null}
        onDismiss={() => setEditParam(null)}
        header={`Edit parameter: ${editParam?.parameterName}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditParam(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={modifyParams.isPending}
                onClick={() => {
                  if (!editParam) return;
                  modifyParams.mutate(
                    {
                      name,
                      parameters: [editParam],
                    },
                    {
                      onSuccess: () => setEditParam(null),
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
            <FormField label="Parameter value">
              <Input
                value={editParam?.parameterValue || ""}
                onChange={({ detail }) =>
                  setEditParam((p) =>
                    p ? { ...p, parameterValue: detail.value } : null
                  )
                }
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  Route 53 (DNS — Hosted Zones + Record Sets)
// ────────────────────────────────────────────────────────

const RECORD_TYPE_OPTIONS: SelectProps.Option[] = [
  { label: "A", value: "A" },
  { label: "AAAA", value: "AAAA" },
  { label: "CNAME", value: "CNAME" },
  { label: "MX", value: "MX" },
  { label: "NS", value: "NS" },
  { label: "PTR", value: "PTR" },
  { label: "SOA", value: "SOA" },
  { label: "SPF", value: "SPF" },
  { label: "SRV", value: "SRV" },
  { label: "TXT", value: "TXT" },
];


function RDSClusterParameterGroupList() {
  const { data, isLoading, isError, error } = useRDSClusterParameterGroups();
  const createCPG = useRDSCreateClusterParameterGroup();
  const deleteCPG = useRDSDeleteClusterParameterGroup();

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    family: CLUSTER_PG_FAMILY_OPTIONS[0],
    description: "",
  });

  const items = (data?.clusterParameterGroups || []).map((g) => ({
    name: g.name,
    family: g.family,
    description: g.description,
  }));

  function resetForm() {
    setForm({
      name: "",
      family: CLUSTER_PG_FAMILY_OPTIONS[0],
      description: "",
    });
  }

  function handleCreate() {
    if (!form.name) return;
    createCPG.mutate(
      {
        dbClusterParameterGroupName: form.name,
        dbParameterGroupFamily: form.family.value,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          resetForm();
        },
      }
    );
  }

  if (selectedGroup) {
    return (
      <RDSParameterGroupParametersView
        name={selectedGroup}
        type="cluster-parameter-group"
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <>
      {isError && (
        <StatusIndicator type="error">
          {(error as Error)?.message || "Failed to load cluster parameter groups"}
        </StatusIndicator>
      )}

      <ResourceTable
        resourceName="Cluster Parameter Group"
        headerTitle="Cluster Parameter Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button variant="link" onClick={() => setSelectedGroup(item.name)}>
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          {
            id: "family",
            header: "Family",
            cell: (item: any) => item.family,
          },
          {
            id: "description",
            header: "Description",
            cell: (item: any) => item.description,
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="cluster parameter group"
                loading={
                  deleteCPG.isPending && deleteCPG.variables === item.name
                }
                onDelete={() => deleteCPG.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        loading={isLoading}
        emptyMessage="No cluster parameter groups found"
        filterEnabled
        filterPlaceholder="Find groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => {
          setShowCreate(false);
          resetForm();
        }}
        header="Create Cluster Parameter Group"
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
                loading={createCPG.isPending}
                disabled={!form.name}
                onClick={handleCreate}
              >
                Create group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createCPG.isError && (
            <Alert type="error" dismissible>
              {(createCPG.error as Error)?.message ||
                "Failed to create cluster parameter group"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Cluster parameter group name"
              description="Must be unique within your account."
            >
              <Input
                value={form.name}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, name: detail.value }))
                }
                placeholder="my-cluster-params"
              />
            </FormField>
            <FormField label="Parameter group family">
              <Select
                selectedOption={form.family}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, family: detail.selectedOption }))
                }
                options={CLUSTER_PG_FAMILY_OPTIONS}
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description}
                onChange={({ detail }) =>
                  setForm((p) => ({ ...p, description: detail.value }))
                }
                placeholder="My custom cluster parameter group"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  ECR
// ────────────────────────────────────────────────────────

