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
  useApiGatewayV2WebSocketRoutes,
  useApiGatewayV2Authorizers,
  useCreateApiGatewayV2Authorizer,
  useUpdateApiGatewayV2Authorizer,
  useDeleteApiGatewayV2Authorizer,
  useApiGatewayV2Models,
  useCreateApiGatewayV2Model,
  useUpdateApiGatewayV2Model,
  useDeleteApiGatewayV2Model,
  useApiGatewayV2IntegrationResponses,
  useCreateApiGatewayV2IntegrationResponse,
  useDeleteApiGatewayV2IntegrationResponse,
  useApiGatewayV2RouteResponses,
  useCreateApiGatewayV2RouteResponse,
  useDeleteApiGatewayV2RouteResponse,
  useUpdateApiGatewayV2Route,
  useUpdateApiGatewayV2Integration,
  useUpdateApiGatewayV2Stage,
  useUpdateApiGatewayV2Deployment,
  useApiGatewayV2Tags,
  useTagApiGatewayV2Resource,
  useUntagApiGatewayV2Resource,
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

export function ApiGatewayV2Dashboard() {
  const { data, isLoading } = useApiGatewayV2Apis();
  const deleteApi = useDeleteApiGatewayV2Api();
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const { data: routesData } = useApiGatewayV2Routes(selectedApi);
  const { data: integrationsData } = useApiGatewayV2Integrations(selectedApi);
  const { data: stagesData } = useApiGatewayV2Stages(selectedApi);
  const { data: deploymentsData } = useApiGatewayV2Deployments(selectedApi);
  const { data: wsRoutesData } = useApiGatewayV2WebSocketRoutes(selectedApi);
  const createDeployment = useCreateApiGatewayV2Deployment(selectedApi || "");
  const { data: authorizersData } = useApiGatewayV2Authorizers(selectedApi);
  const createAuthorizer = useCreateApiGatewayV2Authorizer(selectedApi || "");
  const updateAuthorizer = useUpdateApiGatewayV2Authorizer(selectedApi || "");
  const deleteAuthorizer = useDeleteApiGatewayV2Authorizer(selectedApi || "");
  const { data: modelsData } = useApiGatewayV2Models(selectedApi);
  const createModel = useCreateApiGatewayV2Model(selectedApi || "");
  const updateModel = useUpdateApiGatewayV2Model(selectedApi || "");
  const deleteModel = useDeleteApiGatewayV2Model(selectedApi || "");
  const updateRoute = useUpdateApiGatewayV2Route(selectedApi || "");
  const updateIntegration = useUpdateApiGatewayV2Integration(selectedApi || "");
  const updateStage = useUpdateApiGatewayV2Stage(selectedApi || "");
  const updateDeployment = useUpdateApiGatewayV2Deployment(selectedApi || "");
  const { data: tagsData } = useApiGatewayV2Tags(selectedApi);
  const tagResource = useTagApiGatewayV2Resource(selectedApi || "");
  const untagResource = useUntagApiGatewayV2Resource(selectedApi || "");
  const [showTags, setShowTags] = useState(false);
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [showCreateAuthorizer, setShowCreateAuthorizer] = useState(false);
  const [editAuthorizer, setEditAuthorizer] = useState<any>(null);
  const [authorizerForm, setAuthorizerForm] = useState({ name: "", authorizerType: "REQUEST", identitySource: "", authorizerUri: "" });

  // Cloudscape Select onChange — untestable in happy-dom
  /* v8 ignore next */
  function handleRouteAuthChange({ detail }: any) { setRouteForm((p) => ({ ...p, authorizationType: detail.selectedOption?.value! })); }
  /* v8 ignore next */
  function handleIntegrationTypeChange({ detail }: any) { setIntegrationForm((p) => ({ ...p, integrationType: detail.selectedOption?.value! })); }
  /* v8 ignore next */
  function handleAuthorizerTypeChange({ detail }: any) { setAuthorizerForm((p) => ({ ...p, authorizerType: detail.selectedOption?.value! })); }
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [editModel, setEditModel] = useState<any>(null);
  const [modelForm, setModelForm] = useState({ name: "", contentType: "application/json", schema: "" });
  const [editRoute, setEditRoute] = useState<any>(null);
  const [routeForm, setRouteForm] = useState({ routeKey: "", authorizationType: "NONE", target: "" });
  const [editIntegration, setEditIntegration] = useState<any>(null);
  const [integrationForm, setIntegrationForm] = useState({ integrationType: "AWS_PROXY", integrationUri: "", integrationMethod: "" });
  const [editStage, setEditStage] = useState<any>(null);
  const [stageForm, setStageForm] = useState({ autoDeploy: false, deploymentId: "", description: "" });
  const [editDeployment, setEditDeployment] = useState<any>(null);
  const [deploymentDesc, setDeploymentDesc] = useState("");
  const [routeResponsesFor, setRouteResponsesFor] = useState<string | null>(null);
  const [integrationResponsesFor, setIntegrationResponsesFor] = useState<string | null>(null);
  const [showCreateRouteResponse, setShowCreateRouteResponse] = useState(false);
  const [routeResponseKey, setRouteResponseKey] = useState("");
  const [showCreateIntegrationResponse, setShowCreateIntegrationResponse] = useState(false);
  const [integrationResponseKey, setIntegrationResponseKey] = useState("");
  const routeResponsesQuery = useApiGatewayV2RouteResponses(selectedApi, routeResponsesFor);
  const integrationResponsesQuery = useApiGatewayV2IntegrationResponses(selectedApi, integrationResponsesFor);
  const createRouteResponse = useCreateApiGatewayV2RouteResponse(selectedApi || "", routeResponsesFor || "");
  const deleteRouteResponse = useDeleteApiGatewayV2RouteResponse(selectedApi || "", routeResponsesFor || "");
  const createIntegrationResponse = useCreateApiGatewayV2IntegrationResponse(selectedApi || "", integrationResponsesFor || "");
  const deleteIntegrationResponse = useDeleteApiGatewayV2IntegrationResponse(selectedApi || "", integrationResponsesFor || "");
  const { showToast } = useToast();

  if (isLoading) return <TableSkeleton />;

  if (selectedApi) {
    return (
      <>
        <Box margin={{ bottom: "s" }}>
          <SpaceBetween direction="horizontal" size="s">
            <Button iconName="arrow-left" onClick={() => setSelectedApi(null)}>
              Back to APIs
            </Button>
            <Button onClick={() => setShowTags(true)}>
              Tags
            </Button>
          </SpaceBetween>
        </Box>
        <Tabs
          tabs={[
            {
              id: "routes",
              label: "Routes",
              content: (
                <>
                  {routeResponsesFor && (
                    <Container
                      header={
                        <Header variant="h3" actions={
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button iconName="close" variant="link" onClick={() => setRouteResponsesFor(null)}>Close</Button>
                            <Button variant="primary" onClick={() => { setRouteResponseKey(""); setShowCreateRouteResponse(true); }}>Create response</Button>
                          </SpaceBetween>
                        }>
                          Route responses
                        </Header>
                      }
                    >
                      <ResourceTable
                        resourceName="Route Response"
                        headerTitle={`Route responses for ${routeResponsesFor}`}
                        headerCounter={routeResponsesQuery.data?.total}
                        items={(routeResponsesQuery.data?.routeResponses || []).map((rr: any) => ({
                          id: rr.RouteResponseId,
                          key: rr.RouteResponseKey,
                        }))}
                        loading={false}
                        emptyMessage="No route responses"
                        columns={[
                          { id: "key", header: "Response Key", cell: (i: any) => i.key, isRowHeader: true },
                          {
                            id: "actions",
                            header: "",
                            cell: (i: any) => (
                              <DeleteButton
                                itemName={i.key}
                                resourceType="route response"
                                loading={deleteRouteResponse.isPending}
                                onDelete={() =>
                                  deleteRouteResponse
                                    .mutateAsync(i.id)
                                    .then(
                                      () => showToast("success", `Route response "${i.key}" deleted`),
                                      (err) => showToast("error", (err as Error)?.message || "Failed to delete route response"),
                                    )
                                }
                              />
                            ),
                          },
                        ]}
                      />
                    </Container>
                  )}
                  <ResourceTable
                    resourceName="Route"
                    headerTitle={`Routes in ${selectedApi}`}
                    headerCounter={routesData?.total}
                    items={(routesData?.routes || []).map((r: any) => ({
                      id: r.RouteId,
                      key: r.RouteKey,
                      auth: r.AuthorizationType || "NONE",
                      target: r.Target || "-",
                    }))}
                    loading={false}
                    emptyMessage="No routes"
                    columns={[
                      { id: "key", header: "Route Key", cell: (i: any) => i.key, isRowHeader: true },
                      { id: "auth", header: "Auth", cell: (i: any) => i.auth },
                      { id: "target", header: "Target", cell: (i: any) => i.target },
                      {
                        id: "actions",
                        header: "",
                        cell: (i: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={() => setRouteResponsesFor(i.id)}>Responses</Button>
                            <Button
                              variant="link"
                              onClick={() => {
                                setEditRoute(i);
                                setRouteForm({ routeKey: i.key, authorizationType: i.auth, target: i.target !== "-" ? i.target : "" });
                              }}
                            >
                              Edit
                            </Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find routes"
                    filterFunction={(i: any, s: string) => i.key.toLowerCase().includes(s.toLowerCase())}
                  />
                  <Modal
                    visible={showCreateRouteResponse}
                    onDismiss={() => setShowCreateRouteResponse(false)}
                    header="Create route response"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateRouteResponse(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createRouteResponse.isPending}
                            disabled={!routeResponseKey.trim()}
                            onClick={() =>
                              createRouteResponse.mutate(
                                { routeResponseKey: routeResponseKey.trim() },
                                {
                                  onSuccess: () => {
                                    setShowCreateRouteResponse(false);
                                    showToast("success", "Route response created");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to create route response"),
                                }
                              )
                            }
                          >
                            Create
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <FormField label="Response key">
                        <Input
                          value={routeResponseKey}
                          onChange={({ detail }) => setRouteResponseKey(detail.value)}
                          placeholder="200"
                        />
                      </FormField>
                    </Form>
                  </Modal>
                  <Modal
                    visible={!!editRoute}
                    onDismiss={() => setEditRoute(null)}
                    header="Edit route"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setEditRoute(null)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={updateRoute.isPending}
                            disabled={!routeForm.routeKey.trim()}
                            onClick={() =>
                              updateRoute.mutate(
                                {
                                  routeId: editRoute!.id,
                                  routeKey: routeForm.routeKey.trim(),
                                  authorizationType: routeForm.authorizationType !== "NONE" ? routeForm.authorizationType : undefined,
                                  target: routeForm.target.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setEditRoute(null);
                                    showToast("success", "Route updated");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to update route"),
                                }
                              )
                            }
                          >
                            Save
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <SpaceBetween size="m">
                        <FormField label="Route key">
                          <Input
                            value={routeForm.routeKey}
                            onChange={({ detail }) => setRouteForm((p) => ({ ...p, routeKey: detail.value }))}
                          />
                        </FormField>
                        <FormField label="Authorization type">
                          <Select                            selectedOption={{ label: routeForm.authorizationType, value: routeForm.authorizationType }}
                            onChange={handleRouteAuthChange}
                            options={[
                              { label: "NONE", value: "NONE" },
                              { label: "JWT", value: "JWT" },
                              { label: "CUSTOM", value: "CUSTOM" },
                            ]}
                          />
                        </FormField>
                        <FormField label="Target">
                          <Input
                            value={routeForm.target}
                            onChange={({ detail }) => setRouteForm((p) => ({ ...p, target: detail.value }))}
                            placeholder="integrations/i-1"
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                </>
              ),
            },
            {
              id: "integrations",
              label: "Integrations",
              content: (
                <>
                  {integrationResponsesFor && (
                    <Container
                      header={
                        <Header variant="h3" actions={
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button iconName="close" variant="link" onClick={() => setIntegrationResponsesFor(null)}>Close</Button>
                            <Button variant="primary" onClick={() => { setIntegrationResponseKey(""); setShowCreateIntegrationResponse(true); }}>Create response</Button>
                          </SpaceBetween>
                        }>
                          Integration responses
                        </Header>
                      }
                    >
                      <ResourceTable
                        resourceName="Integration Response"
                        headerTitle={`Integration responses for ${integrationResponsesFor}`}
                        headerCounter={integrationResponsesQuery.data?.total}
                        items={(integrationResponsesQuery.data?.integrationResponses || []).map((ir: any) => ({
                          id: ir.IntegrationResponseId,
                          key: ir.IntegrationResponseKey,
                        }))}
                        loading={false}
                        emptyMessage="No integration responses"
                        columns={[
                          { id: "key", header: "Response Key", cell: (i: any) => i.key, isRowHeader: true },
                          {
                            id: "actions",
                            header: "",
                            cell: (i: any) => (
                              <DeleteButton
                                itemName={i.key}
                                resourceType="integration response"
                                loading={deleteIntegrationResponse.isPending}
                                onDelete={() =>
                                  deleteIntegrationResponse
                                    .mutateAsync(i.id)
                                    .then(
                                      () => showToast("success", `Integration response "${i.key}" deleted`),
                                      (err) => showToast("error", (err as Error)?.message || "Failed to delete integration response"),
                                    )
                                }
                              />
                            ),
                          },
                        ]}
                      />
                    </Container>
                  )}
                  <ResourceTable
                    resourceName="Integration"
                    headerTitle={`Integrations in ${selectedApi}`}
                    headerCounter={integrationsData?.total}
                    items={(integrationsData?.integrations || []).map((i: any) => ({
                      id: i.IntegrationId,
                      type: i.IntegrationType,
                      uri: i.IntegrationUri || "-",
                      method: i.IntegrationMethod || "-",
                    }))}
                    loading={false}
                    emptyMessage="No integrations"
                    columns={[
                      { id: "type", header: "Type", cell: (i: any) => i.type, isRowHeader: true },
                      { id: "uri", header: "URI", cell: (i: any) => i.uri },
                      { id: "method", header: "Method", cell: (i: any) => i.method },
                      {
                        id: "actions",
                        header: "",
                        cell: (i: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={() => setIntegrationResponsesFor(i.id)}>Responses</Button>
                            <Button
                              variant="link"
                              onClick={() => {
                                setEditIntegration(i);
                                setIntegrationForm({
                                  integrationType: i.type,
                                  integrationUri: i.uri !== "-" ? i.uri : "",
                                  integrationMethod: i.method !== "-" ? i.method : "",
                                });
                              }}
                            >
                              Edit
                            </Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find integrations"
                    filterFunction={(i: any, s: string) => i.type.toLowerCase().includes(s.toLowerCase())}
                  />
                  <Modal
                    visible={showCreateIntegrationResponse}
                    onDismiss={() => setShowCreateIntegrationResponse(false)}
                    header="Create integration response"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateIntegrationResponse(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createIntegrationResponse.isPending}
                            disabled={!integrationResponseKey.trim()}
                            onClick={() =>
                              createIntegrationResponse.mutate(
                                { integrationResponseKey: integrationResponseKey.trim() },
                                {
                                  onSuccess: () => {
                                    setShowCreateIntegrationResponse(false);
                                    showToast("success", "Integration response created");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to create integration response"),
                                }
                              )
                            }
                          >
                            Create
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <FormField label="Response key">
                        <Input
                          value={integrationResponseKey}
                          onChange={({ detail }) => setIntegrationResponseKey(detail.value)}
                          placeholder="200"
                        />
                      </FormField>
                    </Form>
                  </Modal>
                  <Modal
                    visible={!!editIntegration}
                    onDismiss={() => setEditIntegration(null)}
                    header="Edit integration"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setEditIntegration(null)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={updateIntegration.isPending}
                            disabled={!integrationForm.integrationType.trim()}
                            onClick={() =>
                              updateIntegration.mutate(
                                {
                                  integrationId: editIntegration!.id,
                                  integrationType: integrationForm.integrationType,
                                  integrationUri: integrationForm.integrationUri.trim() || undefined,
                                  integrationMethod: integrationForm.integrationMethod.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setEditIntegration(null);
                                    showToast("success", "Integration updated");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to update integration"),
                                }
                              )
                            }
                          >
                            Save
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <SpaceBetween size="m">
                        <FormField label="Integration type">
                          <Select                            selectedOption={{ label: integrationForm.integrationType, value: integrationForm.integrationType }}
                            onChange={handleIntegrationTypeChange}
                            options={[
                              { label: "AWS_PROXY", value: "AWS_PROXY" },
                              { label: "HTTP_PROXY", value: "HTTP_PROXY" },
                              { label: "AWS", value: "AWS" },
                            ]}
                          />
                        </FormField>
                        <FormField label="Integration URI">
                          <Input
                            value={integrationForm.integrationUri}
                            onChange={({ detail }) => setIntegrationForm((p) => ({ ...p, integrationUri: detail.value }))}
                            placeholder="arn:aws:apigateway:..."
                          />
                        </FormField>
                        <FormField label="Integration method">
                          <Input
                            value={integrationForm.integrationMethod}
                            onChange={({ detail }) => setIntegrationForm((p) => ({ ...p, integrationMethod: detail.value }))}
                            placeholder="POST"
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                </>
              ),
            },
            {
              id: "stages",
              label: "Stages",
              content: (
                <>
                  <ResourceTable
                    resourceName="Stage"
                    headerTitle={`Stages in ${selectedApi}`}
                    headerCounter={stagesData?.total}
                    items={(stagesData?.stages || []).map((s: any) => ({
                      id: s.StageName,
                      name: s.StageName,
                      autoDeploy: s.AutoDeploy ? "Yes" : "No",
                      deployment: s.DeploymentId || "-",
                      created: s.CreatedDate ? new Date(s.CreatedDate * 1000).toLocaleDateString() : "-",
                    }))}
                    loading={false}
                    emptyMessage="No stages"
                    columns={[
                      { id: "name", header: "Stage", cell: (i: any) => i.name, isRowHeader: true },
                      { id: "autoDeploy", header: "Auto Deploy", cell: (i: any) => i.autoDeploy },
                      { id: "deployment", header: "Deployment", cell: (i: any) => i.deployment },
                      { id: "created", header: "Created", cell: (i: any) => i.created },
                      {
                        id: "actions",
                        header: "",
                        cell: (i: any) => (
                          <Button
                            variant="link"
                            onClick={() => {
                              setEditStage(i);
                              setStageForm({ autoDeploy: i.autoDeploy === "Yes", deploymentId: i.deployment !== "-" ? i.deployment : "", description: "" });
                            }}
                          >
                            Edit
                          </Button>
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find stages"
                    filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  />
                  <Modal
                    visible={!!editStage}
                    onDismiss={() => setEditStage(null)}
                    header="Edit stage"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setEditStage(null)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={updateStage.isPending}
                            onClick={() =>
                              updateStage.mutate(
                                {
                                  stageName: editStage!.id,
                                  autoDeploy: stageForm.autoDeploy,
                                  deploymentId: stageForm.deploymentId.trim() || undefined,
                                  description: stageForm.description.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setEditStage(null);
                                    showToast("success", "Stage updated");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to update stage"),
                                }
                              )
                            }
                          >
                            Save
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <SpaceBetween size="m">
                        <FormField label="Auto deploy">
                          <Checkbox
                            checked={stageForm.autoDeploy}
                            onChange={({ detail }) => setStageForm((p) => ({ ...p, autoDeploy: detail.checked }))}
                          >
                            Auto-deploy changes to this stage
                          </Checkbox>
                        </FormField>
                        <FormField label="Deployment ID">
                          <Input
                            value={stageForm.deploymentId}
                            onChange={({ detail }) => setStageForm((p) => ({ ...p, deploymentId: detail.value }))}
                            placeholder="d-1234"
                          />
                        </FormField>
                        <FormField label="Description">
                          <Input
                            value={stageForm.description}
                            onChange={({ detail }) => setStageForm((p) => ({ ...p, description: detail.value }))}
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                </>
              ),
            },
            {
              id: "deployments",
              label: "Deployments",
              content: (
                <>
                  <ResourceTable
                    resourceName="Deployment"
                    headerTitle={`Deployments in ${selectedApi}`}
                    headerCounter={deploymentsData?.total}
                    items={(deploymentsData?.deployments || []).map((d: any) => ({
                      id: d.DeploymentId,
                      status: d.DeploymentStatus || "-",
                      created: d.CreatedDate ? new Date(d.CreatedDate * 1000).toLocaleDateString() : "-",
                      description: d.Description || "-",
                    }))}
                    loading={false}
                    onCreate={() => createDeployment.mutateAsync({})}
                    emptyMessage="No deployments"
                    columns={[
                      { id: "id", header: "Deployment ID", cell: (i: any) => i.id, isRowHeader: true },
                      { id: "status", header: "Status", cell: (i: any) => i.status },
                      { id: "description", header: "Description", cell: (i: any) => i.description },
                      { id: "created", header: "Created", cell: (i: any) => i.created },
                      {
                        id: "actions",
                        header: "",
                        cell: (i: any) => (
                          <Button
                            variant="link"
                            onClick={() => {
                              setEditDeployment(i);
                              setDeploymentDesc(i.description !== "-" ? i.description : "");
                            }}
                          >
                            Edit
                          </Button>
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find deployments"
                    filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
                  />
                  <Modal
                    visible={!!editDeployment}
                    onDismiss={() => setEditDeployment(null)}
                    header="Edit deployment"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setEditDeployment(null)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={updateDeployment.isPending}
                            onClick={() =>
                              updateDeployment.mutate(
                                { deploymentId: editDeployment!.id, description: deploymentDesc.trim() },
                                {
                                  onSuccess: () => {
                                    setEditDeployment(null);
                                    showToast("success", "Deployment updated");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to update deployment"),
                                }
                              )
                            }
                          >
                            Save
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <FormField label="Description">
                        <Input
                          value={deploymentDesc}
                          onChange={({ detail }) => setDeploymentDesc(detail.value)}
                        />
                      </FormField>
                    </Form>
                  </Modal>
                </>
              ),
            },
            {
              id: "websocket-routes",
              label: "WebSocket Routes",
              content: (
                <SpaceBetween size="s">
                  <Alert type="info" header="WebSocket route resolution">
                    Each route below is resolved to its backing integration. Live
                    per-connection management (@connections GetConnection /
                    PostToConnection / DeleteConnection) requires a live per-API
                    callback endpoint and is not available here.
                  </Alert>
                  <ResourceTable
                    resourceName="WebSocket Route"
                    headerTitle={`WebSocket routes in ${selectedApi}`}
                    headerCounter={wsRoutesData?.total}
                    items={(wsRoutesData?.routes || []).map((r: any) => ({
                      id: r.RouteId,
                      key: r.RouteKey,
                      wellKnown: r.isWellKnown ? "Yes" : "No",
                      integrationType: r.integration?.IntegrationType || "-",
                      integrationUri: r.integration?.IntegrationUri || "-",
                      auth: r.authorizationType || "NONE",
                    }))}
                    loading={false}
                    emptyMessage="No WebSocket routes"
                    columns={[
                      { id: "key", header: "Route Key", cell: (i: any) => i.key, isRowHeader: true },
                      { id: "wellKnown", header: "Well-known?", cell: (i: any) => i.wellKnown },
                      { id: "integrationType", header: "Integration Type", cell: (i: any) => i.integrationType },
                      { id: "integrationUri", header: "Integration URI", cell: (i: any) => i.integrationUri },
                      { id: "auth", header: "Auth", cell: (i: any) => i.auth },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find WebSocket routes"
                    filterFunction={(i: any, s: string) => i.key.toLowerCase().includes(s.toLowerCase())}
                  />
                </SpaceBetween>
              ),
            },
{
              id: "authorizers",
              label: "Authorizers",
              content: (
                <>
                  <ResourceTable
                    resourceName="Authorizer"
                    headerTitle={`Authorizers in ${selectedApi}`}
                    headerCounter={authorizersData?.total}
                    items={(authorizersData?.authorizers || []).map((a: any) => ({
                      id: a.AuthorizerId,
                      name: a.Name,
                      type: a.AuthorizerType || "-",
                      uri: a.AuthorizerUri || "-",
                    }))}
                    loading={false}
                    emptyMessage="No authorizers"
                    onCreate={() => {
                      setAuthorizerForm({ name: "", authorizerType: "REQUEST", identitySource: "", authorizerUri: "" });
                      setShowCreateAuthorizer(true);
                    }}
                    columns={[
                      { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                      { id: "type", header: "Type", cell: (i: any) => i.type },
                      { id: "uri", header: "URI", cell: (i: any) => i.uri },
                      {
                        id: "actions",
                        header: "",
                        cell: (i: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              variant="link"
                              onClick={() => {
                                setEditAuthorizer(i);
                                setAuthorizerForm({ name: i.name, authorizerType: i.type !== "-" ? i.type : "REQUEST", identitySource: "", authorizerUri: i.uri !== "-" ? i.uri : "" });
                              }}
                            >
                              Edit
                            </Button>
                            <DeleteButton
                              itemName={i.name}
                              resourceType="authorizer"
                              loading={deleteAuthorizer.isPending}
                              onDelete={() =>
                                deleteAuthorizer
                                  .mutateAsync(i.id)
                                  .then(
                                    () => showToast("success", `Authorizer "${i.name}" deleted`),
                                    (err) => showToast("error", (err as Error)?.message || "Failed to delete authorizer"),
                                  )
                              }
                            />
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find authorizers"
                    filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  />
                  <Modal
                    visible={showCreateAuthorizer}
                    onDismiss={() => setShowCreateAuthorizer(false)}
                    header="Create authorizer"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateAuthorizer(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createAuthorizer.isPending}
                            disabled={!authorizerForm.name.trim()}
                            onClick={() =>
                              createAuthorizer.mutate(
                                {
                                  name: authorizerForm.name.trim(),
                                  authorizerType: authorizerForm.authorizerType,
                                  identitySource: authorizerForm.identitySource.trim()
                                    ? authorizerForm.identitySource.split(",").map((s: string) => s.trim())
                                    : undefined,
                                  authorizerUri: authorizerForm.authorizerUri.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setShowCreateAuthorizer(false);
                                    showToast("success", `Authorizer "${authorizerForm.name.trim()}" created`);
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to create authorizer"),
                                }
                              )
                            }
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
                            value={authorizerForm.name}
                            onChange={({ detail }) => setAuthorizerForm((p) => ({ ...p, name: detail.value }))}
                            placeholder="my-authorizer"
                          />
                        </FormField>
                        <FormField label="Authorizer type">
                          <Select
                            selectedOption={{ label: authorizerForm.authorizerType, value: authorizerForm.authorizerType }}
                            onChange={handleAuthorizerTypeChange}
                            options={[
                              { label: "REQUEST", value: "REQUEST" },
                              { label: "JWT", value: "JWT" },
                            ]}
                          />
                        </FormField>
                        <FormField label="Identity source" description="Comma-separated. e.g. $request.header.Authorization">
                          <Input
                            value={authorizerForm.identitySource}
                            onChange={({ detail }) => setAuthorizerForm((p) => ({ ...p, identitySource: detail.value }))}
                          />
                        </FormField>
                        <FormField label="Authorizer URI">
                          <Input
                            value={authorizerForm.authorizerUri}
                            onChange={({ detail }) => setAuthorizerForm((p) => ({ ...p, authorizerUri: detail.value }))}
                            placeholder="arn:aws:lambda:..."
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                  <Modal
                    visible={!!editAuthorizer}
                    onDismiss={() => setEditAuthorizer(null)}
                    header="Edit authorizer"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setEditAuthorizer(null)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={updateAuthorizer.isPending}
                            disabled={!authorizerForm.name.trim()}
                            onClick={() =>
                              updateAuthorizer.mutate(
                                {
                                  authorizerId: editAuthorizer!.id,
                                  name: authorizerForm.name.trim(),
                                  authorizerType: authorizerForm.authorizerType,
                                  identitySource: undefined,
                                  authorizerUri: authorizerForm.authorizerUri.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setEditAuthorizer(null);
                                    showToast("success", "Authorizer updated");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to update authorizer"),
                                }
                              )
                            }
                          >
                            Save
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <SpaceBetween size="m">
                        <FormField label="Name">
                          <Input
                            value={authorizerForm.name}
                            onChange={({ detail }) => setAuthorizerForm((p) => ({ ...p, name: detail.value }))}
                          />
                        </FormField>
                        <FormField label="Authorizer type">
                          <Select
                            selectedOption={{ label: authorizerForm.authorizerType, value: authorizerForm.authorizerType }}
                            onChange={handleAuthorizerTypeChange}
                            options={[
                              { label: "REQUEST", value: "REQUEST" },
                              { label: "JWT", value: "JWT" },
                            ]}
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                </>
              ),
            },
            {
              id: "models",
              label: "Models",
              content: (
                <>
                  <ResourceTable
                    resourceName="Model"
                    headerTitle={`Models in ${selectedApi}`}
                    headerCounter={modelsData?.total}
                    items={(modelsData?.models || []).map((m: any) => ({
                      id: m.ModelId,
                      name: m.Name,
                      contentType: m.ContentType || "-",
                    }))}
                    loading={false}
                    emptyMessage="No models"
                    onCreate={() => {
                      setModelForm({ name: "", contentType: "application/json", schema: "" });
                      setShowCreateModel(true);
                    }}
                    columns={[
                      { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                      { id: "contentType", header: "Content Type", cell: (i: any) => i.contentType },
                      {
                        id: "actions",
                        header: "",
                        cell: (i: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              variant="link"
                              onClick={() => {
                                setEditModel(i);
                                setModelForm({ name: i.name, contentType: i.contentType !== "-" ? i.contentType : "application/json", schema: "" });
                              }}
                            >
                              Edit
                            </Button>
                            <DeleteButton
                              itemName={i.name}
                              resourceType="model"
                              loading={deleteModel.isPending}
                              onDelete={() =>
                                deleteModel
                                  .mutateAsync(i.id)
                                  .then(
                                    () => showToast("success", `Model "${i.name}" deleted`),
                                    (err) => showToast("error", (err as Error)?.message || "Failed to delete model"),
                                  )
                              }
                            />
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    filterEnabled
                    filterPlaceholder="Find models"
                    filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  />
                  <Modal
                    visible={showCreateModel}
                    onDismiss={() => setShowCreateModel(false)}
                    header="Create model"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateModel(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createModel.isPending}
                            disabled={!modelForm.name.trim()}
                            onClick={() =>
                              createModel.mutate(
                                {
                                  name: modelForm.name.trim(),
                                  contentType: modelForm.contentType,
                                  schema: modelForm.schema.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setShowCreateModel(false);
                                    showToast("success", `Model "${modelForm.name.trim()}" created`);
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to create model"),
                                }
                              )
                            }
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
                            value={modelForm.name}
                            onChange={({ detail }) => setModelForm((p) => ({ ...p, name: detail.value }))}
                            placeholder="pet-model"
                          />
                        </FormField>
                        <FormField label="Content type">
                          <Input
                            value={modelForm.contentType}
                            onChange={({ detail }) => setModelForm((p) => ({ ...p, contentType: detail.value }))}
                          />
                        </FormField>
                        <FormField label="Schema (JSON)">
                          <Textarea
                            value={modelForm.schema}
                            onChange={({ detail }) => setModelForm((p) => ({ ...p, schema: detail.value }))}
                            placeholder='{"type":"object"}'
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                  <Modal
                    visible={!!editModel}
                    onDismiss={() => setEditModel(null)}
                    header="Edit model"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setEditModel(null)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={updateModel.isPending}
                            disabled={!modelForm.name.trim()}
                            onClick={() =>
                              updateModel.mutate(
                                {
                                  modelId: editModel!.id,
                                  name: modelForm.name.trim(),
                                  contentType: modelForm.contentType,
                                  schema: modelForm.schema.trim() || undefined,
                                },
                                {
                                  onSuccess: () => {
                                    setEditModel(null);
                                    showToast("success", "Model updated");
                                  },
                                  onError: (err) => showToast("error", (err as Error)?.message || "Failed to update model"),
                                }
                              )
                            }
                          >
                            Save
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      <SpaceBetween size="m">
                        <FormField label="Name">
                          <Input
                            value={modelForm.name}
                            onChange={({ detail }) => setModelForm((p) => ({ ...p, name: detail.value }))}
                          />
                        </FormField>
                        <FormField label="Content type">
                          <Input
                            value={modelForm.contentType}
                            onChange={({ detail }) => setModelForm((p) => ({ ...p, contentType: detail.value }))}
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                </>
              ),
            },
                      ]}
        />
        <Modal
          visible={showTags}
          onDismiss={() => setShowTags(false)}
          header={`Tags — ${selectedApi}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowTags(false)}>Close</Button>
                <Button
                  variant="primary"
                  disabled={!tagKey.trim()}
                  onClick={() =>
                    tagResource.mutate(
                      { ...(tagsData?.tags || {}), [tagKey.trim()]: tagValue.trim() },
                      {
                        onSuccess: () => {
                          setTagKey("");
                          setTagValue("");
                          showToast("success", "Tag added");
                        },
                        onError: (err) => showToast("error", (err as Error)?.message || "Failed to add tag"),
                      }
                    )
                  }
                >
                  Add tag
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <div>
              <Header variant="h3">Current tags</Header>
              <SpaceBetween direction="horizontal" size="xs">
                {Object.entries(tagsData?.tags || {}).map(([k, v]) => (
                  <Button
                    key={k}
                    variant="link"
                    iconName="close"
                    onClick={() =>
                      untagResource.mutate(
                        [k],
                        {
                          onSuccess: () => showToast("success", `Tag "${k}" removed`),
                          onError: (err) => showToast("error", (err as Error)?.message || "Failed to remove tag"),
                        }
                      )
                    }
                  >
                    {k}: {v}
                  </Button>
                ))}
                {Object.keys(tagsData?.tags || {}).length === 0 && <Box>No tags</Box>}
              </SpaceBetween>
            </div>
            <FormField label="Key">
              <Input
                value={tagKey}
                onChange={({ detail }) => setTagKey(detail.value)}
                placeholder="environment"
              />
            </FormField>
            <FormField label="Value">
              <Input
                value={tagValue}
                onChange={({ detail }) => setTagValue(detail.value)}
                placeholder="dev"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </>
    );
  }

  return (
    <ResourceTable
      resourceName="API"
      headerTitle="API Gateway V2 APIs"
      headerCounter={data?.total}
      items={(data?.apis || []).map((a: any) => ({
        id: a.ApiId,
        name: a.Name,
        protocol: a.ProtocolType || "HTTP",
        endpoint: a.ApiEndpoint || "-",
        created: a.CreatedDate ? new Date(a.CreatedDate * 1000).toLocaleDateString() : "-",
      }))}
      loading={isLoading}
      emptyMessage="No APIs"
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (i: any) => (
            <Button variant="link" onClick={() => setSelectedApi(i.id)}>
              {i.name}
            </Button>
          ),
          isRowHeader: true,
        },
        { id: "protocol", header: "Protocol", cell: (i: any) => i.protocol },
        { id: "endpoint", header: "Endpoint", cell: (i: any) => i.endpoint },
        { id: "created", header: "Created", cell: (i: any) => i.created },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <DeleteButton
              itemName={i.name}
              resourceType="API"
              loading={deleteApi.isPending && deleteApi.variables === i.id}
              onDelete={() => deleteApi.mutateAsync(i.id)}
            />
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find APIs by name"
      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
    />
  );
}

// ────────────────────────────────────────────────────────
//  ACM (Certificate Manager)
// ────────────────────────────────────────────────────────

