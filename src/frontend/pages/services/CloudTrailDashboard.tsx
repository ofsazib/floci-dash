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
  useLookupEvents,
  useEventSelectors,
  usePutEventSelectors,
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

export function CloudTrailDashboard() {
  const { data, isLoading } = useCloudTrailTrails();
  const deleteTrail = useDeleteCloudTrailTrail();
  const startLogging = useStartCloudTrailLogging();
  const stopLogging = useStopCloudTrailLogging();
  const [activeTab, setActiveTab] = useState("trails");
  const [selectedTrail, setSelectedTrail] = useState<string | null>(null);

  const tabs: TabsProps.Tab[] = [
    {
      label: "Trails",
      id: "trails",
      content: (
        <ResourceTable
          resourceName="Trail"
          headerTitle="CloudTrail Trails"
          headerCounter={data?.total}
          items={(data?.trails || []).map((t: any) => ({
/* istanbul ignore next */
            name: t.Name,
            arn: t.TrailARN,
            bucket: t.S3BucketName || "-",
            multiRegion: t.IsMultiRegionTrail ? "Yes" : "No",
            globalEvents: t.IncludeGlobalServiceEvents ? "Yes" : "No",
            homeRegion: t.HomeRegion || "-",
            created: t.CreationDate ? new Date(t.CreationDate * 1000).toLocaleDateString() : "-",
          }))}
          loading={isLoading}
          emptyMessage="No trails"
          columns={[
            { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
            { id: "bucket", header: "S3 Bucket", cell: (i: any) => i.bucket },
            { id: "multiRegion", header: "Multi-Region", cell: (i: any) => i.multiRegion },
            { id: "globalEvents", header: "Global Events", cell: (i: any) => i.globalEvents },
            { id: "homeRegion", header: "Home Region", cell: (i: any) => i.homeRegion },
            { id: "created", header: "Created", cell: (i: any) => i.created },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="normal"
                    onClick={() => { setSelectedTrail(i.name); setActiveTab("event-selectors"); }}
                  >
                    Event Selectors
                  </Button>
                  <DeleteButton
                    itemName={i.name}
                    resourceType="trail"
                    loading={deleteTrail.isPending && deleteTrail.variables === i.name}
                    onDelete={() => deleteTrail.mutateAsync(i.name)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          filterEnabled
          filterPlaceholder="Find trails by name"
          filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        />
      ),
    },
    {
      label: "Lookup Events",
      id: "lookup",
      content: <LookupEventsTab />,
    },
    ...(selectedTrail
      ? [
          {
            label: `Event Selectors: ${selectedTrail}`,
            id: "event-selectors",
            content: (
              <EventSelectorsTab
                trailName={selectedTrail}
                onBack={() => setActiveTab("trails")}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => {
        setActiveTab(detail.activeTabId);
        setSelectedTrail(null);
      }}
      tabs={tabs}
    />
  );
}

// ── CloudTrail Lookup Events Tab ────────────────────────

const LOOKUP_ATTRIBUTES: SelectProps.Option[] = [
  { label: "Event ID", value: "EventId" },
  { label: "Event Name", value: "EventName" },
  { label: "Event Source", value: "EventSource" },
  { label: "Username", value: "Username" },
  { label: "Resource Name", value: "ResourceName" },
  { label: "Resource Type", value: "ResourceType" },
  { label: "Read Only", value: "ReadOnly" },
  { label: "Access Key ID", value: "AccessKeyId" },
];

function LookupEventsTab() {
  const lookupMutation = useLookupEvents();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attrKey, setAttrKey] = useState<SelectProps.Option>(LOOKUP_ATTRIBUTES[0]);
  const [attrValue, setAttrValue] = useState("");
  const [maxResults, setMaxResults] = useState("50");
  const [results, setResults] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  function handleSearch() {
    setResults(null);
    const params: any = { maxResults: parseInt(maxResults) || 50 };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (attrValue.trim()) {
      params.lookupAttributes = [
        { AttributeKey: attrKey.value as string, AttributeValue: attrValue.trim() },
      ];
    }
    lookupMutation.mutate(params, {
      onSuccess: (data) => setResults(data),
    });
  }

  let eventJson: any = null;
  if (selectedEvent?.cloudTrailEvent) {
    try {
      eventJson = JSON.parse(selectedEvent.cloudTrailEvent);
    } catch {}
  }

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2" description="Search for CloudTrail events by attribute and time range">Lookup Events</Header>}>
        <SpaceBetween size="m">
          {lookupMutation.isError && (
            <Alert type="error" dismissible>
              {(lookupMutation.error as Error)?.message || "Lookup failed"}
            </Alert>
          )}
          <Form>
            <ColumnLayout columns={2} variant="text-grid">
              <FormField label="Start time" description="ISO 8601 timestamp (e.g. 2024-01-01T00:00:00Z)">
                <Input
                  value={startTime}
                  onChange={({ detail }) => setStartTime(detail.value)}
                  placeholder="2024-01-01T00:00:00Z"
                />
              </FormField>
              <FormField label="End time" description="ISO 8601 timestamp">
                <Input
                  value={endTime}
                  onChange={({ detail }) => setEndTime(detail.value)}
                  placeholder="2024-12-31T23:59:59Z"
                />
              </FormField>
            </ColumnLayout>

            <FormField label="Filter attribute" description="Filter events by a specific attribute key and value.">
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 200 }}>
                  <Select
                    selectedOption={attrKey}
                    onChange={({ detail }) => setAttrKey(detail.selectedOption)}
                    options={LOOKUP_ATTRIBUTES}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    value={attrValue}
                    onChange={({ detail }) => setAttrValue(detail.value)}
                    placeholder="Filter value..."
                  />
                </div>
              </div>
            </FormField>

            <FormField label="Max results" description="Maximum number of events to return (1-50).">
              <Input
                value={maxResults}
                onChange={({ detail }) => setMaxResults(detail.value)}
                type="number"
              />
            </FormField>

            <Button
              variant="primary"
              iconName="search"
              loading={lookupMutation.isPending}
              onClick={handleSearch}
            >
              Search events
            </Button>
          </Form>
        </SpaceBetween>
      </Container>

      {results && (
        <Container
          header={
            <Header variant="h3" counter={`(${results.total})`}>
              Results
            </Header>
          }
        >
          {results.total === 0 ? (
            <Box color="text-body-secondary" padding={{ top: "m", bottom: "m" }}>
              No events found. Try adjusting your search criteria.
            </Box>
          ) : (
            <SpaceBetween size="m">
              <Table
                columnDefinitions={[
                  { id: "time", header: "Time", cell: (e: any) => e.eventTime ? new Date(e.eventTime).toLocaleString() : "—", width: 200 },
                  { id: "name", header: "Event Name", cell: (e: any) => e.eventName || "—" },
                  { id: "source", header: "Source", cell: (e: any) => (
                    <code style={{ fontSize: 12 }}>{e.eventSource || "—"}</code>
                  )},
                  { id: "user", header: "User", cell: (e: any) => e.username || "—" },
                  {
                    id: "detail",
                    header: "",
                    width: 80,
                    cell: (e: any) => (
                      <Button variant="normal" onClick={() => setSelectedEvent(e)}>
                        Details
                      </Button>
                    ),
                  },
                ]}
                items={results.events}
              />
              {results.nextToken && (
                <Box padding={{ top: "s" }}>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Box variant="small" color="text-body-secondary">
                      More results available.
                    </Box>
                    <Button
                      variant="normal"
                      loading={lookupMutation.isPending}
                      onClick={() => {
                        const params: any = { maxResults: parseInt(maxResults) || 50, nextToken: results.nextToken };
                        if (startTime) params.startTime = startTime;
                        if (endTime) params.endTime = endTime;
                        if (attrValue.trim()) {
                          params.lookupAttributes = [
                            { AttributeKey: attrKey.value as string, AttributeValue: attrValue.trim() },
                          ];
                        }
                        lookupMutation.mutate(params, {
                          onSuccess: (data) => setResults((prev: any) => ({
                            events: [...(prev?.events || []), ...data.events],
                            nextToken: data.nextToken,
                            total: (prev?.total || 0) + data.total,
                          })),
                        });
                      }}
                    >
                      Load more
                    </Button>
                  </SpaceBetween>
                </Box>
              )}
            </SpaceBetween>
          )}
        </Container>
      )}

      <Modal
        visible={!!selectedEvent}
        onDismiss={() => setSelectedEvent(null)}
        header="Event Detail"
        size="large"
      >
        {selectedEvent && (
          <SpaceBetween size="m">
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="small" color="text-body-secondary">Event ID</Box>
                <code style={{ fontSize: 12 }}>{selectedEvent.eventId}</code>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">Event Name</Box>
                <Box variant="strong">{selectedEvent.eventName}</Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">Event Time</Box>
                <Box>{selectedEvent.eventTime ? new Date(selectedEvent.eventTime).toLocaleString() : "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">Event Source</Box>
                <code style={{ fontSize: 12 }}>{selectedEvent.eventSource}</code>
              </div>
              <div>
                <Box variant="small" color="text-body-secondary">Username</Box>
                <Box>{selectedEvent.username || "—"}</Box>
              </div>
            </ColumnLayout>

            {selectedEvent.resources && selectedEvent.resources.length > 0 && (
              <Container header={<Header variant="h3">Resources</Header>}>
                <SpaceBetween size="xs">
                  {selectedEvent.resources.map((r: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <Box variant="small" color="text-body-secondary">{r.ResourceType || "Resource"}:</Box>
                      <code style={{ fontSize: 13 }}>{r.ResourceName || "—"}</code>
                    </div>
                  ))}
                </SpaceBetween>
              </Container>
            )}

            {eventJson && (
              <Container header={<Header variant="h3">Event Record</Header>}>
                <Box variant="code">
                  <pre className="fd-code-block" style={{ maxHeight: "400px", overflow: "auto", fontSize: 12 }}>
                    {JSON.stringify(eventJson, null, 2)}
                  </pre>
                </Box>
              </Container>
            )}
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
}

// ── CloudTrail Event Selectors Tab ───────────────────────

const READ_WRITE_OPTIONS: SelectProps.Option[] = [
  { label: "All", value: "All" },
  { label: "ReadOnly", value: "ReadOnly" },
  { label: "WriteOnly", value: "WriteOnly" },
];

const FIELD_OPTIONS: SelectProps.Option[] = [
  { label: "eventCategory", value: "eventCategory" },
  { label: "eventSource", value: "eventSource" },
  { label: "eventName", value: "eventName" },
  { label: "eventType", value: "eventType" },
  { label: "userIdentity.arn", value: "userIdentity.arn" },
  { label: "resources.type", value: "resources.type" },
  { label: "resources.ARN", value: "resources.ARN" },
  { label: "readOnly", value: "readOnly" },
];

function EventSelectorsTab({ trailName, onBack }: { trailName: string; onBack: () => void }) {
  const { data, isLoading } = useEventSelectors(trailName);
  const putSelectors = usePutEventSelectors(trailName);
  const { showToast } = useToast();

  const [rwSelect, setRwSelect] = useState<SelectProps.Option>(READ_WRITE_OPTIONS[0]);
  const [includeMgmt, setIncludeMgmt] = useState(true);
  const [advancedFields, setAdvancedFields] = useState<
    Array<{ field: SelectProps.Option; equals: string }>
  >([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (data?.eventSelectors && data.eventSelectors.length > 0) {
      const sel = data.eventSelectors[0];
      if (sel.ReadWriteType) {
        setRwSelect(
          READ_WRITE_OPTIONS.find((o) => o.value === sel.ReadWriteType) || READ_WRITE_OPTIONS[0]
        );
      }
      setIncludeMgmt(sel.IncludeManagementEvents !== false);
    }
    if (data?.advancedEventSelectors && data.advancedEventSelectors.length > 0) {
      setShowAdvanced(true);
      const fields = data.advancedEventSelectors.flatMap((aes) =>
        (aes.FieldSelectors || []).map((fs) => ({
          field: FIELD_OPTIONS.find((o) => o.value === fs.Field) || FIELD_OPTIONS[0],
          equals: (fs.Equals || [])[0] || "",
        }))
      );
      if (fields.length > 0) setAdvancedFields(fields);
    }
  }, [data?.eventSelectors, data?.advancedEventSelectors]);

  function handleSave() {
    const eventSelectors = [
      {
        ReadWriteType: rwSelect.value as string,
        IncludeManagementEvents: includeMgmt,
      },
    ];
    const params: any = { eventSelectors };
    if (showAdvanced && advancedFields.length > 0) {
      params.advancedEventSelectors = [
        {
          Name: "Custom",
          FieldSelectors: advancedFields.map((af) => ({
            Field: af.field.value as string,
            Equals: af.equals ? [af.equals] : undefined,
          })),
        },
      ];
    }
    putSelectors.mutate(params, {
      onSuccess: () => showToast("success", "Event selectors updated"),
      onError: (err) => showToast("error", err.message),
    });
  }

  if (isLoading) return <Spinner />;

  return (
    <SpaceBetween size="l">
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="link" onClick={onBack}>
          ← Back to trails
        </Button>
      </div>

      <Container header={<Header variant="h2">Event Selectors for {trailName}</Header>}>
        <SpaceBetween size="m">
          <Box variant="p" color="text-body-secondary">
            Configure which events are captured by this trail. Basic event selectors control management and data events.
            Advanced event selectors provide fine-grained field-level filtering.
          </Box>

          {putSelectors.isError && (
            <Alert type="error" dismissible>
              {(putSelectors.error as Error)?.message || "Failed to update event selectors"}
            </Alert>
          )}

          <Form>
            <FormField label="Read/Write type" description="Filter events by read-only, write-only, or all.">
              <Select
                selectedOption={rwSelect}
                onChange={({ detail }) => setRwSelect(detail.selectedOption)}
                options={READ_WRITE_OPTIONS}
              />
            </FormField>

            <Checkbox checked={includeMgmt} onChange={({ detail }) => setIncludeMgmt(detail.checked)}>
              Include management events
            </Checkbox>

            <Box variant="h3" padding={{ top: "m" }}>
              Advanced Event Selectors
            </Box>
            <Box variant="p" color="text-body-secondary" padding={{ bottom: "s" }}>
              Filter events using field selectors. Leave disabled to use basic selectors only.
            </Box>

            <Checkbox checked={showAdvanced} onChange={({ detail }) => setShowAdvanced(detail.checked)}>
              Enable advanced event selectors
            </Checkbox>

            {showAdvanced && (
              <SpaceBetween size="s">
                {advancedFields.map((af, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ width: 200 }}>
                      <FormField label={i === 0 ? "Field" : ""}>
                        <Select
                          selectedOption={af.field}
                          onChange={({ detail }) =>
                            setAdvancedFields((prev) =>
                              prev.map((a, idx) => (idx === i ? { ...a, field: detail.selectedOption } : a))
                            )
                          }
                          options={FIELD_OPTIONS}
                        />
                      </FormField>
                    </div>
                    <div style={{ flex: 1 }}>
                      <FormField label={i === 0 ? "Equals" : ""}>
                        <Input
                          value={af.equals}
                          onChange={({ detail }) =>
                            setAdvancedFields((prev) =>
                              prev.map((a, idx) => (idx === i ? { ...a, equals: detail.value } : a))
                            )
                          }
                          placeholder="Value to match..."
                        />
                      </FormField>
                    </div>
                    <Button
                      variant="icon"
                      iconName="remove"
                      ariaLabel="Remove field"
                      onClick={() => setAdvancedFields((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </div>
                ))}
                <Button
                  variant="normal"
                  iconName="add-plus"
                  onClick={() =>
                    setAdvancedFields((prev) => [
                      ...prev,
                      { field: FIELD_OPTIONS[0], equals: "" },
                    ])
                  }
                >
                  Add field
                </Button>
              </SpaceBetween>
            )}

            <Box padding={{ top: "l" }}>
              <Button
                variant="primary"
                loading={putSelectors.isPending}
                onClick={handleSave}
              >
                Save event selectors
              </Button>
            </Box>
          </Form>

          {(data?.eventSelectors?.length ?? 0) > 0 && (
            <Container header={<Header variant="h3">Current Configuration</Header>}>
              <SpaceBetween size="s">
                <Box variant="strong">Basic Event Selectors:</Box>
                {data!.eventSelectors.map((es: any, i: number) => (
                  <Box key={i} variant="small">
                    Read/Write: {es.ReadWriteType || "All"}, Management: {es.IncludeManagementEvents !== false ? "Yes" : "No"}
                  </Box>
                ))}
                {(data?.advancedEventSelectors?.length ?? 0) > 0 && (
                  <>
                    <Box variant="strong" padding={{ top: "s" }}>Advanced Event Selectors:</Box>
                    {data!.advancedEventSelectors.map((aes: any, i: number) => (
                      <Box key={i} variant="small">
                        {aes.Name}: {(aes.FieldSelectors || []).map((fs: any) => `${fs.Field}=${(fs.Equals || [])[0]}`).join(", ")}
                      </Box>
                    ))}
                  </>
                )}
              </SpaceBetween>
            </Container>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  AWS Config
// ────────────────────────────────────────────────────────

