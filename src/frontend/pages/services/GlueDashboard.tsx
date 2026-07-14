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
  useGlueRegistries,
  useCreateGlueRegistry,
  useDeleteGlueRegistry,
  useGlueSchemas,
  useCreateGlueSchema,
  useDeleteGlueSchema,
  useGlueSchemaVersions,
  useRegisterGlueSchemaVersion,
  useGlueUDFs,
  useCreateGlueUDF,
  useUpdateGlueUDF,
  useDeleteGlueUDF,
  useGlueColumnStats,
  useGluePartitionColumnStats,
  useUpdateGlueColumnStats,
  useDeleteGlueColumnStats,
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

export function GlueDashboard() {
  const { data: dbData, isLoading } = useGlueDatabases();
  const deleteDb = useDeleteGlueDatabase();
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const { data: tblData } = useGlueTables(selectedDb);
  const deleteTbl = useDeleteGlueTable(selectedDb || "");
  const [activeTab, setActiveTab] = useState("databases");

  if (isLoading) return <TableSkeleton />;

  const tabs: TabsProps.Tab[] = [
    {
      id: "databases",
      label: "Databases & Tables",
      content: selectedDb ? (
        <>
          <Box margin={{ bottom: "s" }}>
            <Button iconName="arrow-left" onClick={() => setSelectedDb(null)}>
              Back to databases
            </Button>
          </Box>
          <ResourceTable
            resourceName="Table"
            headerTitle={`Tables in ${selectedDb}`}
            headerCounter={tblData?.total}
            items={(tblData?.tables || []).map((t: any) => ({
              name: t.Name,
              type: t.TableType || "-",
              location: t.StorageDescriptor?.Location || "-",
              columns: t.StorageDescriptor?.Columns?.length || 0,
              created: t.CreateTime ? new Date(t.CreateTime).toLocaleDateString() : "-",
            }))}
            loading={false}
            emptyMessage="No tables"
            columns={[
              { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
              { id: "type", header: "Type", cell: (i: any) => i.type },
              { id: "location", header: "Location", cell: (i: any) => i.location },
              { id: "columns", header: "Columns", cell: (i: any) => i.columns },
              { id: "created", header: "Created", cell: (i: any) => i.created },
              {
                id: "actions",
                header: "",
                cell: (i: any) => (
                  <DeleteButton
                    itemName={i.name}
                    resourceType="table"
                    loading={deleteTbl.isPending && deleteTbl.variables === i.name}
                    onDelete={() => deleteTbl.mutateAsync(i.name)}
                  />
                ),
              },
            ]}
            filterEnabled
            filterPlaceholder="Find tables"
            filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
          />
        </>
      ) : (
        <ResourceTable
          resourceName="Database"
          headerTitle="Glue Databases"
          headerCounter={dbData?.total}
          items={(dbData?.databases || []).map((d: any) => ({
            name: d.Name,
            description: d.Description || "-",
            location: d.LocationUri || "-",
            created: d.CreateTime ? new Date(d.CreateTime).toLocaleDateString() : "-",
          }))}
          loading={isLoading}
          emptyMessage="No Glue databases"
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (i: any) => (
                <Button variant="link" onClick={() => setSelectedDb(i.name)}>
                  {i.name}
                </Button>
              ),
              isRowHeader: true,
            },
            { id: "description", header: "Description", cell: (i: any) => i.description },
            { id: "location", header: "Location", cell: (i: any) => i.location },
            { id: "created", header: "Created", cell: (i: any) => i.created },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <DeleteButton
                  itemName={i.name}
                  resourceType="database"
                  loading={deleteDb.isPending && deleteDb.variables === i.name}
                  onDelete={() => deleteDb.mutateAsync(i.name)}
                />
              ),
            },
          ]}
          filterEnabled
          filterPlaceholder="Find databases"
          filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        />
      ),
    },
    { id: "schemaRegistry", label: "Schema Registry", content: <SchemaRegistryTab /> },
    { id: "udfs", label: "UDFs", content: <UDFsTab /> },
    { id: "columnStats", label: "Column Stats", content: <ColumnStatsTab /> },
  ];

  return <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />;
}

function SchemaRegistryTab() {
  const { showToast } = useToast();
  const registriesQuery = useGlueRegistries();
  const createRegistry = useCreateGlueRegistry();
  const deleteRegistry = useDeleteGlueRegistry();
  const [selectedRegistry, setSelectedRegistry] = useState<string | null>(null);
  const [showCreateRegistry, setShowCreateRegistry] = useState(false);
  const [regName, setRegName] = useState("");
  const [showCreateSchema, setShowCreateSchema] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const schemasQuery = useGlueSchemas(selectedRegistry);
  const createSchema = useCreateGlueSchema(selectedRegistry || "");
  const deleteSchema = useDeleteGlueSchema(selectedRegistry || "");
  const versionsQuery = useGlueSchemaVersions(selectedRegistry, selectedSchema);
  const registerVersion = useRegisterGlueSchemaVersion(selectedRegistry || "", selectedSchema || "");
  const [showRegisterVersion, setShowRegisterVersion] = useState(false);
  const [schemaDef, setSchemaDef] = useState("{}");

  const registries = registriesQuery.data?.registries || [];
  const schemas = schemasQuery.data?.schemas || [];
  const versions = versionsQuery.data?.versions || [];

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header
            variant="h2"
            counter={`(${registries.length})`}
            actions={<Button onClick={() => setShowCreateRegistry(true)}>Create registry</Button>}
          >
            Registries
          </Header>
        }
      >
        <ResourceTable
          resourceName="Registry"
          items={registries}
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (r: any) => (
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedRegistry(r.name);
                    setSelectedSchema(null);
                  }}
                >
                  {r.name}
                </Button>
              ),
              isRowHeader: true,
            },
            { id: "status", header: "Status", cell: (r: any) => <StatusIndicator type={r.status === "AVAILABLE" ? "success" : "warning"}>{r.status}</StatusIndicator> },
            { id: "description", header: "Description", cell: (r: any) => r.description || "-" },
            {
              id: "actions",
              header: "",
              cell: (r: any) => (
                <DeleteButton
                  itemName={r.name}
                  resourceType="registry"
                  loading={deleteRegistry.isPending && deleteRegistry.variables === r.name}
                  onDelete={() => { deleteRegistry.mutateAsync(r.name); if (selectedRegistry === r.name) setSelectedRegistry(null); }}
                />
              ),
            },
          ]}
          loading={registriesQuery.isLoading}
          emptyMessage="No registries"
        />
      </Container>

      {selectedRegistry && (
        <>
          <Box>
            <Button iconName="arrow-left" onClick={() => setSelectedRegistry(null)}>
              Back to registries
            </Button>
          </Box>
          <Container
            header={
              <Header
                variant="h3"
                counter={`(${schemas.length})`}
                description={`Registry: ${selectedRegistry}`}
                actions={<Button onClick={() => setShowCreateSchema(true)}>Create schema</Button>}
              >
                Schemas
              </Header>
            }
          >
            <ResourceTable
              resourceName="Schema"
              items={schemas}
              columns={[
                {
                  id: "name",
                  header: "Name",
                  cell: (s: any) => (
                    <Button variant="link" onClick={() => setSelectedSchema(s.name)}>
                      {s.name}
                    </Button>
                  ),
                  isRowHeader: true,
                },
                { id: "format", header: "Format", cell: (s: any) => s.dataFormat || "-" },
                { id: "compatibility", header: "Compatibility", cell: (s: any) => s.compatibility || "-" },
                { id: "status", header: "Status", cell: (s: any) => <StatusIndicator type={s.status === "AVAILABLE" ? "success" : "warning"}>{s.status}</StatusIndicator> },
                {
                  id: "actions",
                  header: "",
                  cell: (s: any) => (
                    <DeleteButton
                      itemName={s.name}
                      resourceType="schema"
                      loading={deleteSchema.isPending && deleteSchema.variables === s.name}
                      onDelete={() => { deleteSchema.mutateAsync(s.name); if (selectedSchema === s.name) setSelectedSchema(null); }}
                    />
                  ),
                },
              ]}
              loading={schemasQuery.isLoading}
              emptyMessage="No schemas"
            />
          </Container>
        </>
      )}

      {selectedSchema && (
        <Container
          header={
            <Header
              variant="h3"
              counter={`(${versions.length})`}
              description={`Schema: ${selectedSchema}`}
              actions={<Button onClick={() => setShowRegisterVersion(true)}>Register version</Button>}
            >
              Schema Versions
            </Header>
          }
        >
          <ResourceTable
            resourceName="Version"
            items={versions}
            columns={[
              { id: "version", header: "Version", cell: (v: any) => `v${v.versionNumber}` },
              { id: "id", header: "Version ID", cell: (v: any) => <span style={{ fontSize: 11 }}>{v.versionId || "-"}</span> },
              { id: "status", header: "Status", cell: (v: any) => <StatusIndicator type={v.status === "AVAILABLE" ? "success" : "warning"}>{v.status}</StatusIndicator> },
              { id: "created", header: "Created", cell: (v: any) => v.createdTime ? new Date(v.createdTime).toLocaleString() : "-" },
            ]}
            loading={versionsQuery.isLoading}
            emptyMessage="No versions registered"
          />
        </Container>
      )}

      {showCreateRegistry && (
        <Modal visible onDismiss={() => { setShowCreateRegistry(false); setRegName(""); }} header="Create Registry" size="medium" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => { setShowCreateRegistry(false); setRegName(""); }}>Cancel</Button>
            <Button variant="primary" loading={createRegistry.isPending} disabled={!regName.trim()} onClick={() => {
              createRegistry.mutate({ name: regName.trim() }, {
                onSuccess: () => { setShowCreateRegistry(false); setRegName(""); showToast("success", "Registry created"); },
                onError: (e: any) => showToast("error", e.message),
              });
            }}>Create</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Registry name"><Input value={regName} onChange={({ detail }) => setRegName(detail.value)} placeholder="my-registry" /></FormField>
          </SpaceBetween>
        </Modal>
      )}

      {showCreateSchema && (
        <CreateSchemaModal
          onClose={() => setShowCreateSchema(false)}
          onCreated={() => { setShowCreateSchema(false); showToast("success", "Schema created"); }}
          createSchema={createSchema}
        />
      )}

      {showRegisterVersion && (
        <Modal visible onDismiss={() => { setShowRegisterVersion(false); setSchemaDef("{}"); }} header="Register Schema Version" size="large" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => { setShowRegisterVersion(false); setSchemaDef("{}"); }}>Cancel</Button>
            <Button variant="primary" loading={registerVersion.isPending} disabled={!schemaDef.trim()} onClick={() => {
              registerVersion.mutate({ definition: schemaDef }, {
                onSuccess: () => { setShowRegisterVersion(false); setSchemaDef("{}"); showToast("success", "Version registered"); },
                onError: (e: any) => showToast("error", e.message),
              });
            }}>Register</Button>
          </SpaceBetween>
        }>
          <FormField label="Schema definition" description="JSON Avro schema definition">
            <Textarea value={schemaDef} onChange={({ detail }) => setSchemaDef(detail.value)} rows={8} placeholder='{"type":"record","name":"MyRecord","fields":[{"name":"id","type":"int"}]}' />
          </FormField>
        </Modal>
      )}
    </SpaceBetween>
  );
}

function CreateSchemaModal({
  onClose,
  onCreated,
  createSchema,
}: {
  onClose: () => void;
  onCreated: () => void;
  createSchema: ReturnType<typeof useCreateGlueSchema>;
}) {
  const [name, setName] = useState("");
  const [dataFormat, setDataFormat] = useState("AVRO");
  const [compatibility, setCompatibility] = useState("NONE");
  const [description, setDescription] = useState("");

  return (
    <Modal visible onDismiss={onClose} header="Create Schema" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={createSchema.isPending} onClick={() => {
          createSchema.mutate({ name: name.trim(), dataFormat, compatibility, description: description.trim() || undefined }, { onSuccess: onCreated });
        }} disabled={!name.trim()}>Create</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Schema name"><Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-schema" /></FormField>
        <FormField label="Data format">
          <Select selectedOption={{ label: dataFormat, value: dataFormat }} onChange={({ detail }) => setDataFormat(detail.selectedOption.value || "AVRO")} options={[{ label: "AVRO", value: "AVRO" }, { label: "JSON", value: "JSON" }]} />
        </FormField>
        <FormField label="Compatibility mode">
          <Select selectedOption={{ label: compatibility, value: compatibility }} onChange={({ detail }) => setCompatibility(detail.selectedOption.value || "NONE")} options={["NONE", "DISABLED", "BACKWARD", "FORWARD", "FULL"].map(v => ({ label: v, value: v }))} />
        </FormField>
        <FormField label="Description (optional)"><Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="Schema description" /></FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ─── UDFs Tab ──────────────────────────────────────────

function UDFsTab() {
  const { showToast } = useToast();
  const { data: dbData } = useGlueDatabases();
  const databases = dbData?.databases || [];
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<{ name: string; className: string } | null>(null);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");

  const udfsQuery = useGlueUDFs(selectedDb);
  const createUDF = useCreateGlueUDF(selectedDb || "");
  const updateUDF = useUpdateGlueUDF(selectedDb || "");
  const deleteUDF = useDeleteGlueUDF(selectedDb || "");

  const udfs = udfsQuery.data?.functions || [];

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">User-Defined Functions</Header>}>
        <SpaceBetween size="m">
          <FormField label="Select a database">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {databases.map((d: any) => (
                <Button key={d.Name} variant={selectedDb === d.Name ? "primary" : "normal"} onClick={() => setSelectedDb(d.Name)}>
                  {d.Name}
                </Button>
              ))}
            </div>
          </FormField>

          {selectedDb && (
            <ResourceTable
              resourceName="Function"
              headerTitle={`UDFs in ${selectedDb}`}
              headerCounter={udfsQuery.data?.total}
              items={udfs}
              columns={[
                { id: "name", header: "Name", cell: (f: any) => f.name, isRowHeader: true },
                { id: "className", header: "Class", cell: (f: any) => <span style={{ fontSize: 12 }}>{f.className}</span> },
                { id: "owner", header: "Owner", cell: (f: any) => `${f.ownerName || "-"} (${f.ownerType || "-"})` },
                { id: "created", header: "Created", cell: (f: any) => f.createTime ? new Date(f.createTime).toLocaleString() : "-" },
                {
                  id: "actions",
                  header: "",
                  cell: (f: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={() => { setEditTarget({ name: f.name, className: f.className }); setClassName(f.className); setShowEdit(true); }}>Edit</Button>
                      <DeleteButton
                        itemName={f.name}
                        resourceType="function"
                        loading={deleteUDF.isPending && deleteUDF.variables === f.name}
                        onDelete={() => deleteUDF.mutateAsync(f.name)}
                      />
                    </SpaceBetween>
                  ),
                },
              ]}
              loading={udfsQuery.isLoading}
              emptyMessage={selectedDb ? "No UDFs found" : "Select a database"}
              onCreate={() => setShowCreate(true)}
            />
          )}
        </SpaceBetween>
      </Container>

      {showCreate && selectedDb && (
        <Modal visible onDismiss={() => { setShowCreate(false); setName(""); setClassName(""); }} header={`Create UDF in ${selectedDb}`} size="medium" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => { setShowCreate(false); setName(""); setClassName(""); }}>Cancel</Button>
            <Button variant="primary" loading={createUDF.isPending} disabled={!name.trim() || !className.trim()} onClick={() => {
              createUDF.mutate({ name: name.trim(), className: className.trim() }, {
                onSuccess: () => { setShowCreate(false); setName(""); setClassName(""); showToast("success", "UDF created"); },
                onError: (e: any) => showToast("error", e.message),
              });
            }}>Create</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Function name"><Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my_function" /></FormField>
            <FormField label="Class name"><Input value={className} onChange={({ detail }) => setClassName(detail.value)} placeholder="com.example.MyUDF" /></FormField>
          </SpaceBetween>
        </Modal>
      )}

      {showEdit && editTarget && selectedDb && (
        <Modal visible onDismiss={() => { setShowEdit(false); setEditTarget(null); }} header={`Edit UDF: ${editTarget.name}`} size="medium" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => { setShowEdit(false); setEditTarget(null); }}>Cancel</Button>
            <Button variant="primary" loading={updateUDF.isPending} disabled={!className.trim()} onClick={() => {
              updateUDF.mutate({ funcName: editTarget.name, className: className.trim() }, {
                onSuccess: () => { setShowEdit(false); setEditTarget(null); showToast("success", "UDF updated"); },
                onError: (e: any) => showToast("error", e.message),
              });
            }}>Save</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Function name"><Input value={editTarget.name} disabled /></FormField>
            <FormField label="Class name"><Input value={className} onChange={({ detail }) => setClassName(detail.value)} /></FormField>
          </SpaceBetween>
        </Modal>
      )}
    </SpaceBetween>
  );
}

// ─── Column Stats Tab ──────────────────────────────────

function ColumnStatsTab() {
  const { showToast } = useToast();
  const { data: dbData } = useGlueDatabases();
  const databases = dbData?.databases || [];
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [partitionValues, setPartitionValues] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateColName, setUpdateColName] = useState("");
  const [updateColType, setUpdateColType] = useState("string");
  const [updateNumNull, setUpdateNumNull] = useState(0);
  const [updateNumDistinct, setUpdateNumDistinct] = useState(0);

  const { data: tblData } = useGlueTables(selectedDb);
  const tables = tblData?.tables || [];

  const partValues = partitionValues.split(/[,\n\s]+/).filter(Boolean);
  const tableStatsQuery = useGlueColumnStats(selectedDb, selectedTable);
  const partitionStatsQuery = useGluePartitionColumnStats(selectedDb, selectedTable, partValues);
  const statsQuery = partValues.length > 0 ? partitionStatsQuery : tableStatsQuery;
  const updateStats = useUpdateGlueColumnStats(selectedDb || "", selectedTable || "");
  const deleteStats = useDeleteGlueColumnStats(selectedDb || "", selectedTable || "");

  const columnStats = statsQuery.data?.columnStats || [];

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">Column Statistics</Header>}>
        <SpaceBetween size="m">
          <FormField label="Select a database">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {databases.map((d: any) => (
                <Button key={d.Name} variant={selectedDb === d.Name ? "primary" : "normal"} onClick={() => { setSelectedDb(d.Name); setSelectedTable(null); }}>
                  {d.Name}
                </Button>
              ))}
            </div>
          </FormField>

          {selectedDb && (
            <>
              <FormField label="Select a table">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {tables.map((t: any) => (
                    <Button key={t.Name} variant={selectedTable === t.Name ? "primary" : "normal"} onClick={() => setSelectedTable(t.Name)}>
                      {t.Name}
                    </Button>
                  ))}
                </div>
              </FormField>

              {selectedTable && (
                <>
                  <FormField label="Partition values (comma-separated, optional)" description="Leave empty for table-level statistics. Set to view partition-level stats.">
                    <Input value={partitionValues} onChange={({ detail }) => setPartitionValues(detail.value)} placeholder="e.g. 2024,01" />
                  </FormField>

                  <Box float="right">
                    <Button variant="primary" onClick={() => setShowUpdateModal(true)}>Update Statistics</Button>
                  </Box>

                  <ResourceTable
                    resourceName="Column"
                    headerTitle={`Stats for ${selectedTable}${partValues.length ? ` (partition: ${partValues})` : ""}`}
                    headerCounter={statsQuery.data?.total}
                    items={columnStats}
                    columns={[
                      { id: "column", header: "Column", cell: (s: any) => s.columnName, isRowHeader: true },
                      { id: "type", header: "Type", cell: (s: any) => <span style={{ fontSize: 12 }}>{s.columnType || "-"}</span> },
                      { id: "data", header: "Statistics", cell: (s: any) => (
                        <pre style={{ fontSize: 10, margin: 0, maxHeight: 60, overflow: "auto" }}>{s.statisticsData ? JSON.stringify(s.statisticsData, null, 2) : "-"}</pre>
                      )},
                      { id: "analyzed", header: "Analyzed", cell: (s: any) => s.analyzedTime ? new Date(s.analyzedTime).toLocaleString() : "-" },
                      {
                        id: "actions",
                        header: "",
                        cell: (s: any) => (
                          <DeleteButton
                            itemName={s.columnName}
                            resourceType="column statistic"
                            loading={deleteStats.isPending && deleteStats.variables === s.columnName}
                            onDelete={() => deleteStats.mutateAsync(s.columnName)}
                          />
                        ),
                      },
                    ]}
                    loading={statsQuery.isLoading}
                    emptyMessage="No column statistics. Click Update Statistics to add."
                  />
                </>
              )}
            </>
          )}
        </SpaceBetween>
      </Container>

      {showUpdateModal && selectedTable && selectedDb && (
        <Modal visible onDismiss={() => setShowUpdateModal(false)} header={`Update Statistics for ${selectedTable}`} size="medium" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
            <Button variant="primary" loading={updateStats.isPending} disabled={!updateColName.trim()} onClick={() => {
              const statsData: any = {
                NumberOfNulls: Number(updateNumNull),
                NumberOfDistinctValues: Number(updateNumDistinct),
              };
              // Wrap in the correct type-specific key for Glue SDK
              const typeKey = `${updateColType.charAt(0).toUpperCase() + updateColType.slice(1)}ColumnStatisticsData`;
              const entry: any = { ColumnName: updateColName.trim(), ColumnType: updateColType, StatisticsData: { [typeKey]: statsData } };
              updateStats.mutate({ columnStatisticsList: [entry] }, {
                onSuccess: () => { setShowUpdateModal(false); showToast("success", "Statistics updated"); },
                onError: (e: any) => showToast("error", e.message),
              });
            }}>Update</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Column name"><Input value={updateColName} onChange={({ detail }) => setUpdateColName(detail.value)} placeholder="column_name" /></FormField>
            <FormField label="Column type">
              <Select selectedOption={{ label: updateColType, value: updateColType }} onChange={({ detail }) => setUpdateColType(detail.selectedOption.value || "string")} options={["string", "integer", "long", "double", "boolean", "date", "binary"].map(v => ({ label: v, value: v }))} />
            </FormField>
            <FormField label="Number of nulls">
              <Input type="number" value={String(updateNumNull)} onChange={({ detail }) => setUpdateNumNull(Number(detail.value) || 0)} />
            </FormField>
            <FormField label="Number of distinct values">
              <Input type="number" value={String(updateNumDistinct)} onChange={({ detail }) => setUpdateNumDistinct(Number(detail.value) || 0)} />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  Firehose
// ────────────────────────────────────────────────────────

