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
  useUpdateGlueTable,
  useGlueTableVersions,
  useDeleteGlueTable,
  useGlueRegistries,
  useCreateGlueRegistry,
  useDeleteGlueRegistry,
  useGlueSchemas,
  useCreateGlueSchema,
  useDeleteGlueSchema,
  useGlueSchemaVersions,
  useRegisterGlueSchemaVersion,
  useGlueSchemaVersion,
  useSchemaVersionMetadata,
  useGlueUDFs,
  useCreateGlueUDF,
  useUpdateGlueUDF,
  useDeleteGlueUDF,
  useGlueColumnStats,
  useGluePartitionColumnStats,
  useUpdateGlueColumnStats,
  useDeleteGlueColumnStats,
  useGluePartitions,
  useCreateGluePartitions,
  useDeleteGluePartition,
  useGlueFamily,
  useCreateGlueFamily,
  useDeleteGlueFamily,
  useStartGlueCrawler,
  useStopGlueCrawler,
  useGlueCrawlerMetrics,
  useStartGlueCrawlerSchedule,
  useStopGlueCrawlerSchedule,
  useUpdateGlueCrawlerSchedule,
  useStartGlueJobRun,
  useStartGlueTrigger,
  useStopGlueTrigger,
  useStartGlueWorkflowRun,
  useGlueResourcePolicy,
  usePutGlueResourcePolicy,
  useDeleteGlueResourcePolicy,
  useGlueDataCatalogEncryptionSettings,
  usePutGlueDataCatalogEncryptionSettings,
  useGlueDataQualityRulesets,
  useSearchGlueTables,
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
  const updateTbl = useUpdateGlueTable();
  const [versionsTbl, setVersionsTbl] = useState<string | null>(null);
  const { data: versionsData } = useGlueTableVersions(selectedDb, versionsTbl);
  const [editTbl, setEditTbl] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
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
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      onClick={() => {
                        setEditTbl(i.name);
                        setEditDesc("");
                      }}
                    >
                      Edit
                    </Button>
                    <Button onClick={() => setVersionsTbl(i.name === versionsTbl ? null : i.name)}>
                      Versions
                    </Button>
                    <DeleteButton
                      itemName={i.name}
                      resourceType="table"
                      loading={deleteTbl.isPending && deleteTbl.variables === i.name}
                      onDelete={() => deleteTbl.mutateAsync(i.name)}
                    />
                  </SpaceBetween>
                ),
              },
            ]}
            filterEnabled
            filterPlaceholder="Find tables"
            filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
          />

          {versionsTbl && (
            <ResourceTable
              resourceName="Version"
              headerTitle={`Versions — ${versionsTbl}`}
              headerCounter={versionsData?.total}
              items={(versionsData?.versions || []).map((v: any) => ({
                versionId: v.versionId,
                created: v.createdTime || "-",
                table: v.table ? v.table.name : "-",
              }))}
              columns={[
                { id: "version", header: "Version", cell: (i: any) => i.versionId, isRowHeader: true },
                { id: "created", header: "Created", cell: (i: any) => i.created },
                { id: "table", header: "Table", cell: (i: any) => i.table },
              ]}
              emptyMessage="No versions"
              loading={false}
            />
          )}

          <Modal
            visible={!!editTbl}
            onDismiss={() => setEditTbl(null)}
            header={`Edit table — ${editTbl!}`}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setEditTbl(null)}>Cancel</Button>
                  <Button
                    variant="primary"
                    loading={updateTbl.isPending}
                    onClick={() => {
                      updateTbl.mutate(
                        {
                          databaseName: selectedDb!,
                          tableName: editTbl!,
                          tableInput: { description: editDesc },
                        },
                        { onSuccess: () => setEditTbl(null) }
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
              {updateTbl.isError && (
                <Alert type="error" dismissible>
                  {(updateTbl.error as Error)?.message || "Failed to update table"}
                </Alert>
              )}
              <FormField label="Description">
                <Input value={editDesc} onChange={({ detail }) => setEditDesc(detail.value)} />
              </FormField>
            </Form>
          </Modal>
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
    { id: "partitions", label: "Partitions", content: <PartitionsTab /> },
    { id: "columnStats", label: "Column Stats", content: <ColumnStatsTab /> },
    { id: "crawlers", label: "Crawlers", content: <CrawlersTab /> },
    { id: "jobs", label: "Jobs", content: <JobsTab /> },
    { id: "triggers", label: "Triggers", content: <TriggersTab /> },
    { id: "workflows", label: "Workflows", content: <WorkflowsTab /> },
    { id: "connections", label: "Connections", content: <ConnectionsTab /> },
    { id: "classifiers", label: "Classifiers", content: <ClassifiersTab /> },
    { id: "etlOps", label: "ETL Ops", content: <EtlOpsTab /> },
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
  const [detailVersionNumber, setDetailVersionNumber] = useState<number | null>(null);
  const versionDetailQuery = useGlueSchemaVersion(selectedRegistry, selectedSchema, detailVersionNumber);
  const versionDetail = versionDetailQuery.data?.version;
  const detailVersionId = versionDetail?.versionId || null;
  const metadataQuery = useSchemaVersionMetadata(detailVersionId);

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
              {
                id: "actions",
                header: "",
                cell: (v: any) => (
                  <Button variant="link" onClick={() => setDetailVersionNumber(v.versionNumber)}>
                    View
                  </Button>
                ),
              },
            ]}
            loading={versionsQuery.isLoading}
            emptyMessage="No versions registered"
          />
        </Container>
      )}

      {detailVersionNumber != null && (
        <Modal
          visible
          onDismiss={() => setDetailVersionNumber(null)}
          header={`Schema Version v${detailVersionNumber}`}
          size="large"
          footer={
            <Box float="right">
              <Button variant="link" onClick={() => setDetailVersionNumber(null)}>Close</Button>
            </Box>
          }
        >
          {versionDetailQuery.isLoading ? (
            <Spinner />
          ) : versionDetail ? (
            <SpaceBetween size="m">
              <ColumnLayout columns={2} variant="text-grid">
                <div><Box variant="awsui-key-label">Version ID</Box>{versionDetail.versionId || "-"}</div>
                <div><Box variant="awsui-key-label">Status</Box>{versionDetail.status || "-"}</div>
                <div><Box variant="awsui-key-label">Data format</Box>{versionDetail.dataFormat || "-"}</div>
                <div><Box variant="awsui-key-label">Version</Box>{`v${versionDetail.versionNumber}`}</div>
              </ColumnLayout>
              <FormField label="Definition">
                <Textarea value={versionDetail.definition || ""} readOnly rows={8} />
              </FormField>
              <FormField label="Metadata">
                <Textarea
                  value={JSON.stringify(metadataQuery.data?.metadataInfoMap || {}, null, 2)}
                  readOnly
                  rows={4}
                />
              </FormField>
            </SpaceBetween>
          ) : (
            <Box>No version detail available</Box>
          )}
        </Modal>
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
          <Select selectedOption={{ label: dataFormat, value: dataFormat }} onChange={({ detail }) => setDataFormat(detail.selectedOption.value!)} options={[{ label: "AVRO", value: "AVRO" }, { label: "JSON", value: "JSON" }]} />
        </FormField>
        <FormField label="Compatibility mode">
          <Select selectedOption={{ label: compatibility, value: compatibility }} onChange={({ detail }) => setCompatibility(detail.selectedOption.value!)} options={["NONE", "DISABLED", "BACKWARD", "FORWARD", "FULL"].map(v => ({ label: v, value: v }))} />
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
              emptyMessage="No UDFs found"
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

function PartitionsTab() {
  const { showToast } = useToast();
  const { data: dbData } = useGlueDatabases();
  const databases = dbData?.databases || [];
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newValues, setNewValues] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const { data: tblData } = useGlueTables(selectedDb);
  const tables = tblData?.tables || [];

  const partitionsQuery = useGluePartitions(selectedDb, selectedTable);
  const createPartitions = useCreateGluePartitions(selectedDb || "", selectedTable || "");
  const deletePartition = useDeleteGluePartition(selectedDb || "", selectedTable || "");

  const partitions = partitionsQuery.data?.partitions || [];

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">Partitions</Header>}>
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
            <FormField label="Select a table">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tables.map((t: any) => (
                  <Button key={t.Name} variant={selectedTable === t.Name ? "primary" : "normal"} onClick={() => setSelectedTable(t.Name)}>
                    {t.Name}
                  </Button>
                ))}
              </div>
            </FormField>
          )}

          {selectedTable && (
            <>
              <Box float="right">
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>Add Partition</Button>
              </Box>

              <ResourceTable
                resourceName="Partition"
                headerTitle={`Partitions for ${selectedTable}`}
                headerCounter={partitionsQuery.data?.total}
                loading={partitionsQuery.isLoading}
                items={partitions}
                columns={[
                  { id: "values", header: "Values", cell: (p: any) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{(p.values || []).join(", ")}</span>, isRowHeader: true },
                  { id: "location", header: "Location", cell: (p: any) => <span style={{ fontSize: 12 }}>{p.location || "-"}</span> },
                  { id: "created", header: "Created", cell: (p: any) => p.creationTime ? new Date(p.creationTime).toLocaleString() : "-" },
                  {
                    id: "actions",
                    header: "",
                    cell: (p: any) => (
                      <DeleteButton
                        itemName={(p.values || []).join(", ")}
                        resourceType="partition"
                        loading={deletePartition.isPending}
                        onDelete={() =>
                          new Promise<void>((resolve, reject) => {
                            deletePartition.mutate(p.values || [], {
                              onSuccess: () => { showToast("success", "Partition deleted"); resolve(); },
                              onError: (e: any) => { showToast("error", e.message); reject(e); },
                            });
                          })
                        }
                      />
                    ),
                  },
                ]}
              />
            </>
          )}
        </SpaceBetween>
      </Container>

      {showCreateModal && (
        <Modal visible onDismiss={() => setShowCreateModal(false)} header={`Add Partition to ${selectedTable}`} size="medium" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" loading={createPartitions.isPending} disabled={!newValues.trim()} onClick={() => {
              const values = newValues.split(/[,\n\s]+/).filter(Boolean);
              const partitionInput: any = { Values: values };
              if (newLocation.trim()) partitionInput.StorageDescriptor = { Location: newLocation.trim() };
              createPartitions.mutate({ partitionInputList: [partitionInput] }, {
                onSuccess: (res: any) => {
                  if (res?.errors?.length) {
                    showToast("error", res.errors[0]?.ErrorDetail?.ErrorMessage || "Partition creation reported errors");
                  } else {
                    showToast("success", "Partition created");
                  }
                  setShowCreateModal(false);
                  setNewValues("");
                  setNewLocation("");
                },
                onError: (e: any) => showToast("error", e.message),
              });
            }}>Add</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Partition values (comma-separated)" description="Order must match the table's partition keys. e.g. 2024,01">
              <Input value={newValues} onChange={({ detail }) => setNewValues(detail.value)} placeholder="2024,01" />
            </FormField>
            <FormField label="Location (optional)" description="S3 location for the partition data.">
              <Input value={newLocation} onChange={({ detail }) => setNewLocation(detail.value)} placeholder="s3://bucket/path/" />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}
    </SpaceBetween>
  );
}

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
              <Select selectedOption={{ label: updateColType, value: updateColType }} onChange={({ detail }) => setUpdateColType(detail.selectedOption.value!)} options={["string", "integer", "long", "double", "boolean", "date", "binary"].map(v => ({ label: v, value: v }))} />
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


// ────────────────────────────────────────────────────────
//  Glue — ETL tabs (Crawlers / Jobs / Triggers / Workflows /
//  Connections / Classifiers) and ETL Ops
// ────────────────────────────────────────────────────────

function glueEtlName(item: any): string {
  return typeof item === "string" ? item : item.Name || "—";
}

function glueEtlField(item: any, key: string, fallback = "—"): string {
  const v = key.split(".").reduce((acc: any, k: string) => (acc == null ? acc : acc[k]), item);
  return v == null || v === "" ? fallback : String(v);
}

interface GlueEtlFamilyProps {
  title: string;
  family: string;
  resourceName: string;
  fields: Array<{ label: string; key: string; placeholder?: string }>;
  jsonKey: string;
  columns: Array<{ id: string; header: string; cell: (item: any) => any }>;
  renderActions?: (name: string) => React.ReactNode;
}

function GlueEtlFamilyTab({ title, family, resourceName, fields, jsonKey, columns, renderActions }: GlueEtlFamilyProps) {
  const { showToast } = useToast();
  const { data, isLoading } = useGlueFamily(family);
  const createItem = useCreateGlueFamily(family);
  const deleteItem = useDeleteGlueFamily(family);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [jsonText, setJsonText] = useState("{}");
  const [parseError, setParseError] = useState("");

  const handleCreate = () => {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setParseError("Configuration must be valid JSON");
      return;
    }
    setParseError("");
    createItem
      .mutateAsync(buildCreateBody({ name, fieldValues, parsed, jsonKey }))
      .then(() => {
        setShowAdd(false);
        setName("");
        setFieldValues({});
        setJsonText("{}");
        showToast("success", `${resourceName} created`);
      })
      .catch((e: Error) => showToast("error", e.message || `Failed to create ${resourceName.toLowerCase()}`));
  };

  const items = (data?.items || []).map((item: any) => ({
    name: glueEtlName(item),
    raw: item,
  }));

  return (
    <SpaceBetween size="m">
      {createItem.isError && (
        <Alert type="error" dismissible>
          {(createItem.error! as Error).message || `Failed to create ${resourceName.toLowerCase()}`}
        </Alert>
      )}
      <ResourceTable
        resourceName={resourceName}
        headerTitle={title}
        headerCounter={data?.total}
        items={items}
        loading={isLoading}
        emptyMessage={`No ${resourceName.toLowerCase()}s — use Create to add one`}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          ...columns.map((c) => ({ ...c, cell: (i: any) => c.cell(i.raw) })),
          ...(renderActions
            ? [
                {
                  id: "actions",
                  header: "Actions",
                  cell: (i: any) => renderActions(i.name),
                },
              ]
            : []),
          {
            id: "delete",
            header: "",
            cell: (i: any) => (
              <DeleteButton
                itemName={i.name}
                resourceType={resourceName.toLowerCase()}
                loading={deleteItem.isPending && deleteItem.variables === i.name}
                onDelete={() =>
                  deleteItem.mutateAsync(i.name).then(() => showToast("success", `${resourceName} deleted`))
                }
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder={`Find ${resourceName.toLowerCase()}s`}
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowAdd(true)}
      />
      <Modal
        visible={showAdd}
        onDismiss={() => setShowAdd(false)}
        header={`Create ${resourceName}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" loading={createItem.isPending} disabled={!name} onClick={handleCreate}>
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {parseError && <Alert type="error">Invalid JSON in configuration</Alert>}
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder={`my-${family.replace(/s$/, "")}`} />
          </FormField>
          {fields.map((f) => (
            <FormField key={f.key} label={f.label}>
              <Input
                value={fieldValues[f.key] || ""}
                onChange={({ detail }) => setFieldValues((prev) => ({ ...prev, [f.key]: detail.value }))}
                placeholder={f.placeholder}
              />
            </FormField>
          ))}
          <FormField label="Configuration JSON">
            <Textarea value={jsonText} onChange={({ detail }) => setJsonText(detail.value)} rows={6} />
          </FormField>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

function buildCreateBody({ name, fieldValues, parsed, jsonKey }: {
  name: string;
  fieldValues: Record<string, string>;
  parsed: any;
  jsonKey: string;
}): any {
  const body: any = { name };
  Object.keys(fieldValues).forEach((k) => {
    const v = fieldValues[k];
    if (v) body[k] = v;
  });
  body[jsonKey] = parsed;
  return body;
}

function metricRuntime(v: any): string {
  if (v == null) return "—";
  return `${Math.round(v)}s`;
}

function CrawlersTab() {
  const { showToast } = useToast();
  const startCrawler = useStartGlueCrawler();
  const stopCrawler = useStopGlueCrawler();

  const run = (m: typeof startCrawler, name: string, verb: string) =>
    m.mutateAsync(name).then(() => showToast("success", `Crawler ${name} ${verb}`));

  return (
    <GlueEtlFamilyTab
      title="Crawlers"
      family="crawlers"
      resourceName="Crawler"
      fields={[{ label: "IAM Role ARN", key: "role", placeholder: "arn:aws:iam::123456789012:role/glue" }]}
      jsonKey="crawler"
      columns={[
        { id: "state", header: "State", cell: (i: any) => glueEtlField(i, "State", "READY") },
        { id: "role", header: "Role", cell: (i: any) => glueEtlField(i, "Role") },
        { id: "schedule", header: "Schedule", cell: (i: any) => glueEtlField(i, "Schedule.ScheduleExpression", "—") },
      ]}
      renderActions={(name: string) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="normal"
            loading={startCrawler.isPending && startCrawler.variables === name}
            onClick={() => run(startCrawler, name, "started")}
          >
            Start
          </Button>
          <Button
            variant="normal"
            loading={stopCrawler.isPending && stopCrawler.variables === name}
            onClick={() => run(stopCrawler, name, "stopped")}
          >
            Stop
          </Button>
        </SpaceBetween>
      )}
    />
  );
}

function JobsTab() {
  const { showToast } = useToast();
  const startRun = useStartGlueJobRun();

  return (
    <GlueEtlFamilyTab
      title="Jobs"
      family="jobs"
      resourceName="Job"
      fields={[{ label: "IAM Role ARN", key: "role", placeholder: "arn:aws:iam::123456789012:role/glue" }]}
      jsonKey="job"
      columns={[
        { id: "state", header: "State", cell: (i: any) => glueEtlField(i, "JobState", "—") },
        { id: "role", header: "Role", cell: (i: any) => glueEtlField(i, "Role") },
      ]}
      renderActions={(name: string) => (
        <Button
          variant="normal"
          loading={startRun.isPending && startRun.variables === name}
          onClick={() =>
            startRun
              .mutateAsync(name)
              .then((r: any) => showToast("success", `Job run started: ${r.runId}`))
              .catch((e: Error) => showToast("error", e.message))
          }
        >
          Run
        </Button>
      )}
    />
  );
}

function TriggersTab() {
  const { showToast } = useToast();
  const startTrigger = useStartGlueTrigger();
  const stopTrigger = useStopGlueTrigger();

  const run = (m: typeof startTrigger, name: string, verb: string) =>
    m.mutateAsync(name).then(() => showToast("success", `Trigger ${name} ${verb}`));

  return (
    <GlueEtlFamilyTab
      title="Triggers"
      family="triggers"
      resourceName="Trigger"
      fields={[]}
      jsonKey="trigger"
      columns={[
        { id: "state", header: "State", cell: (i: any) => glueEtlField(i, "State", "—") },
        { id: "type", header: "Type", cell: (i: any) => glueEtlField(i, "Type") },
      ]}
      renderActions={(name: string) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="normal"
            loading={startTrigger.isPending && startTrigger.variables === name}
            onClick={() => run(startTrigger, name, "started")}
          >
            Start
          </Button>
          <Button
            variant="normal"
            loading={stopTrigger.isPending && stopTrigger.variables === name}
            onClick={() => run(stopTrigger, name, "stopped")}
          >
            Stop
          </Button>
        </SpaceBetween>
      )}
    />
  );
}

function WorkflowsTab() {
  const { showToast } = useToast();
  const startRun = useStartGlueWorkflowRun();

  return (
    <GlueEtlFamilyTab
      title="Workflows"
      family="workflows"
      resourceName="Workflow"
      fields={[]}
      jsonKey="workflow"
      columns={[
        { id: "created", header: "Created", cell: (i: any) => glueEtlField(i, "CreatedOn", "—") },
      ]}
      renderActions={(name: string) => (
        <Button
          variant="normal"
          loading={startRun.isPending && startRun.variables === name}
          onClick={() =>
            startRun
              .mutateAsync(name)
              .then((r: any) => showToast("success", `Workflow run started: ${r.runId}`))
              .catch((e: Error) => showToast("error", e.message))
          }
        >
          Run
        </Button>
      )}
    />
  );
}

function ConnectionsTab() {
  return (
    <GlueEtlFamilyTab
      title="Connections"
      family="connections"
      resourceName="Connection"
      fields={[{ label: "Connection Type", key: "connectionType", placeholder: "JDBC" }]}
      jsonKey="connectionInput"
      columns={[
        { id: "type", header: "Type", cell: (i: any) => glueEtlField(i, "ConnectionType") },
        { id: "engine", header: "Engine", cell: (i: any) => glueEtlField(i, "ConnectionProperties.KAFKA_CORE_CONNECT_BOOTSTRAP_SERVERS", "—") },
      ]}
    />
  );
}

function ClassifiersTab() {
  return (
    <GlueEtlFamilyTab
      title="Classifiers"
      family="classifiers"
      resourceName="Classifier"
      fields={[{ label: "Classification", key: "classification", placeholder: "csv" }]}
      jsonKey="classifier"
      columns={[
        { id: "classification", header: "Classification", cell: (i: any) => glueEtlField(i, "Classification", "—") },
        { id: "type", header: "Type", cell: (i: any) => (i.GrokClassifier ? "GROK" : "CUSTOM") },
      ]}
    />
  );
}

function EtlOpsTab() {
  const { showToast } = useToast();
  const { data: metricsData } = useGlueCrawlerMetrics();
  const startSchedule = useStartGlueCrawlerSchedule();
  const stopSchedule = useStopGlueCrawlerSchedule();
  const updateSchedule = useUpdateGlueCrawlerSchedule();
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleExpr, setScheduleExpr] = useState("");
  const { data: policyData } = useGlueResourcePolicy();
  const putPolicy = usePutGlueResourcePolicy();
  const deletePolicy = useDeleteGlueResourcePolicy();
  const [policyText, setPolicyText] = useState("{}");
  const { data: encSettings } = useGlueDataCatalogEncryptionSettings();
  const putEncSettings = usePutGlueDataCatalogEncryptionSettings();
  const [encText, setEncText] = useState("{}");
  const { data: rulesetsData } = useGlueDataQualityRulesets();
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const { data: searchData, isLoading: searchLoading } = useSearchGlueTables(searchQuery);

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h3">Crawler Metrics</Header>}>
        <ResourceTable
          resourceName="Metric"
          headerTitle="Crawler Metrics"
          headerCounter={metricsData?.total}
          items={(metricsData?.metrics || []).map((m: any) => ({
            name: m.CrawlerName || "—",
            lastRuntime: metricRuntime(m.LastRuntime),
            median: metricRuntime(m.MedianRuntime),
            failures: m.StillEstimatingFields,
          }))}
          loading={false}
          emptyMessage="No crawler metrics"
          columns={[
            { id: "name", header: "Crawler", cell: (i: any) => i.name, isRowHeader: true },
            { id: "lastRuntime", header: "Last Runtime", cell: (i: any) => i.lastRuntime },
            { id: "median", header: "Median Runtime", cell: (i: any) => i.median },
          ]}
        />
      </Container>

      <Container header={<Header variant="h3">Crawler Schedule</Header>}>
        <SpaceBetween size="s">
          <SpaceBetween direction="horizontal" size="s">
            <Input value={scheduleName} onChange={({ detail }) => setScheduleName(detail.value)} placeholder="Crawler name" />
            <Input value={scheduleExpr} onChange={({ detail }) => setScheduleExpr(detail.value)} placeholder="cron(0 1 * * ? *)" />
          </SpaceBetween>
          <SpaceBetween direction="horizontal" size="s">
            <Button
              variant="normal"
              disabled={!scheduleName}
              loading={startSchedule.isPending}
              onClick={() =>
                startSchedule.mutateAsync(scheduleName).then(() => showToast("success", "Crawler schedule started"))
              }
            >
              Start schedule
            </Button>
            <Button
              variant="normal"
              disabled={!scheduleName}
              loading={stopSchedule.isPending}
              onClick={() =>
                stopSchedule.mutateAsync(scheduleName).then(() => showToast("success", "Crawler schedule stopped"))
              }
            >
              Stop schedule
            </Button>
            <Button
              variant="normal"
              disabled={!scheduleName}
              loading={updateSchedule.isPending}
              onClick={() =>
                updateSchedule
                  .mutateAsync({ crawlerName: scheduleName, schedule: scheduleExpr || undefined })
                  .then(() => showToast("success", "Crawler schedule updated"))
              }
            >
              Update schedule
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h3">Resource Policy</Header>}>
        <SpaceBetween size="s">
          <Box variant="p" color="text-body-secondary">
            {policyData?.policyInJson ? policyData.policyInJson : "No resource policy set"}
          </Box>
          <Textarea value={policyText} onChange={({ detail }) => setPolicyText(detail.value)} rows={6} />
          <SpaceBetween direction="horizontal" size="s">
            <Button
              variant="primary"
              loading={putPolicy.isPending}
              onClick={() =>
                putPolicy.mutateAsync(policyText).then(() => showToast("success", "Resource policy updated"))
              }
            >
              Put policy
            </Button>
            <Button
              variant="normal"
              loading={deletePolicy.isPending}
              onClick={() =>
                deletePolicy.mutateAsync().then(() => showToast("success", "Resource policy deleted"))
              }
            >
              Delete policy
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h3">Data Catalog Encryption Settings</Header>}>
        <SpaceBetween size="s">
          <Box variant="p" color="text-body-secondary">
            {encSettings
              ? `Encryption mode: ${encSettings.dataCatalogEncryptionSettings?.DataCatalogEncryptionMode || "not set"}`
              : "No settings"}
          </Box>
          <Textarea value={encText} onChange={({ detail }) => setEncText(detail.value)} rows={4} />
          <Button
            variant="primary"
            loading={putEncSettings.isPending}
            onClick={() =>
              putEncSettings
                .mutateAsync(JSON.parse(encText))
                .then(() => showToast("success", "Encryption settings updated"))
                .catch((e: Error) => showToast("error", e.message || "Invalid JSON in settings"))
            }
          >
            Put settings
          </Button>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h3">Data Quality Rulesets</Header>}>
        <ResourceTable
          resourceName="Ruleset"
          headerTitle="Data Quality Rulesets"
          headerCounter={rulesetsData?.total}
          items={(rulesetsData?.rulesets || []).map((r: any) => ({ name: glueEtlName(r) }))}
          loading={false}
          emptyMessage="No data quality rulesets"
          columns={[{ id: "name", header: "Ruleset", cell: (i: any) => i.name, isRowHeader: true }]}
        />
      </Container>

      <Container header={<Header variant="h3">Search Tables</Header>}>
        <SpaceBetween size="s">
          <SpaceBetween direction="horizontal" size="s">
            <Input value={searchText} onChange={({ detail }) => setSearchText(detail.value)} placeholder="Search text" />
            <Button
              variant="normal"
              disabled={!searchText}
              loading={searchLoading}
              onClick={() => setSearchQuery(searchText)}
            >
              Search
            </Button>
          </SpaceBetween>
          <ResourceTable
            resourceName="Table"
            headerTitle="Search Results"
            headerCounter={searchData?.total}
            items={(searchData?.tables || []).map((t: any) => ({
              database: glueEtlField(t, "DatabaseName"),
              name: glueEtlName(t),
            }))}
            loading={false}
            emptyMessage={searchQuery ? "No tables matched" : "Enter search text above"}
            columns={[
              { id: "database", header: "Database", cell: (i: any) => i.database, isRowHeader: true },
              { id: "name", header: "Table", cell: (i: any) => i.name },
            ]}
          />
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
