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
import {
  useS3VectorsBuckets,
  useS3VectorsBucket,
  useS3VectorsCreateBucket,
  useS3VectorsDeleteBucket,
  useS3VectorsIndexes,
  useS3VectorsIndex,
  useS3VectorsCreateIndex,
  useS3VectorsDeleteIndex,
  useS3VectorsPutVectors,
  useS3VectorsGetVectors,
  useS3VectorsDeleteVectors,
  useS3VectorsQuery,
} from "../../hooks/useS3Vectors";

export function S3VectorsDashboard() {
  const { showToast } = useToast();
  const { data: bucketsData, isLoading: bucketsLoading } = useS3VectorsBuckets();
  const createBucket = useS3VectorsCreateBucket();
  const deleteBucket = useS3VectorsDeleteBucket();

  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [bucketName, setBucketName] = useState("");

  // Index state
  const { data: indexesData, isLoading: indexesLoading } = useS3VectorsIndexes(selectedBucket);
  const createIndex = useS3VectorsCreateIndex();
  const deleteIndex = useS3VectorsDeleteIndex();

  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [showCreateIndex, setShowCreateIndex] = useState(false);
  const [indexName, setIndexName] = useState("");
  const [dimension, setDimension] = useState("");
  const [distanceMetric, setDistanceMetric] = useState("cosine");

  // Vector data state
  const [vectorsQueryKeys, setVectorsQueryKeys] = useState<string[]>([]);
  const { data: vectorsData, isLoading: vectorsLoading } = useS3VectorsGetVectors(
    selectedBucket,
    selectedIndex,
    vectorsQueryKeys
  );
  const putVectors = useS3VectorsPutVectors();
  const queryVectors = useS3VectorsQuery();

  const [showPutVectors, setShowPutVectors] = useState(false);
  const [showQuery, setShowQuery] = useState(false);
  const [vectorInput, setVectorInput] = useState("[]");
  const [queryVectorInput, setQueryVectorInput] = useState("[0.1, 0.2, 0.3]");
  const [topK, setTopK] = useState("10");
  const [queryResults, setQueryResults] = useState<any[] | null>(null);

  const buckets = bucketsData?.buckets || [];
  const indexes = indexesData?.indexes || [];

  return (
    <SpaceBetween size="l">
      {/* Vector Buckets */}
      <ResourceTable
        resourceName="Vector bucket"
        headerTitle="Vector Buckets"
        headerCounter={buckets.length}
        items={buckets.map((b: any) => ({
          name: b.vectorBucketName || b.name,
          arn: b.vectorBucketArn || "-",
        }))}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "arn", header: "ARN", cell: (i: any) => i.arn },
          { id: "actions", header: "", cell: (i: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                iconName="folder"
                onClick={() => {
                  setSelectedBucket(i.name);
                  setSelectedIndex(null);
                }}
              >
                Indexes
              </Button>
              <DeleteButton
                itemName={i.name}
                resourceType="vector bucket"
                loading={deleteBucket.isPending}
                onDelete={async () => {
                  try {
                    await deleteBucket.mutateAsync(i.name);
                    if (selectedBucket === i.name) {
                      setSelectedBucket(null);
                      setSelectedIndex(null);
                    }
                    showToast("success", `Bucket ${i.name} deleted`);
                  } catch (e: any) { showToast("error", e.message); }
                }}
              />
            </SpaceBetween>
          )},
        ]}
        loading={bucketsLoading}
        filterEnabled
        filterPlaceholder="Find by name"
        filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => { setBucketName(""); setShowCreateBucket(true); }}
      />

      {/* Indexes (shown when a bucket is selected) */}
      {selectedBucket && (
        <ResourceTable
          resourceName="Index"
          headerTitle={`Indexes in ${selectedBucket}`}
          headerCounter={indexes.length}
          items={indexes.map((i: any) => ({
            name: i.indexName || i.name,
            dimension: i.dimension ?? "-",
            distanceMetric: i.distanceMetric || "-",
            dataType: i.dataType || "float32",
            arn: i.indexArn || "-",
          }))}
          columns={[
            { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
            { id: "dimension", header: "Dimension", cell: (i: any) => i.dimension },
            { id: "distanceMetric", header: "Distance Metric", cell: (i: any) => i.distanceMetric },
            { id: "dataType", header: "Data Type", cell: (i: any) => i.dataType },
            { id: "actions", header: "", cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="normal"
                  iconName="folder"
                  onClick={() => {
                    setSelectedIndex(i.name);
                    setVectorsQueryKeys([]);
                    setQueryResults(null);
                  }}
                >
                  Vectors
                </Button>
                <DeleteButton
                  itemName={i.name}
                  resourceType="index"
                  loading={deleteIndex.isPending}
                  onDelete={async () => {
                    try {
                      await deleteIndex.mutateAsync({ bucketName: selectedBucket, indexName: i.name });
                      if (selectedIndex === i.name) setSelectedIndex(null);
                      showToast("success", `Index ${i.name} deleted`);
                    } catch (e: any) { showToast("error", e.message); }
                  }}
                />
              </SpaceBetween>
            )},
          ]}
          loading={indexesLoading}
          filterEnabled
          filterPlaceholder="Find by name"
          filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
          onCreate={() => { setIndexName(""); setDimension(""); setDistanceMetric("cosine"); setShowCreateIndex(true); }}
        />
      )}

      {/* Vector Operations (shown when an index is selected) */}
      {selectedBucket && selectedIndex && (
        <div>
          <Header
            variant="h2"
            description={`Bucket: ${selectedBucket} / Index: ${selectedIndex}`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => { setVectorInput("[]"); setShowPutVectors(true); }}>
                  Put Vectors
                </Button>
                <Button
                  iconName="search"
                  onClick={() => {
                    setQueryVectorInput("[0.1, 0.2, 0.3]");
                    setTopK("10");
                    setShowQuery(true);
                  }}
                >
                  Query
                </Button>
              </SpaceBetween>
            }
          >
            Vector Data
          </Header>

          {vectorsQueryKeys.length > 0 && (
            <ResourceTable
              resourceName="Vector"
              headerTitle="Vectors"
              headerCounter={(vectorsData?.vectors || []).length}
              items={(vectorsData?.vectors || []).map((v: any) => ({
                key: v.key,
                dataPreview: v.data?.float32?.slice(0, 5).join(", ") + (v.data?.float32?.length > 5 ? "..." : "") || "-",
                metadataCount: v.metadata ? Object.keys(v.metadata).length : 0,
              }))}
              columns={[
                { id: "key", header: "Key", cell: (i: any) => i.key, isRowHeader: true },
                { id: "data", header: "Data (preview)", cell: (i: any) => i.dataPreview },
                { id: "metadata", header: "Metadata fields", cell: (i: any) => i.metadataCount },
              ]}
              loading={vectorsLoading}
            />
          )}

          {queryResults && (
            <ResourceTable
              resourceName="Result"
              headerTitle="Query Results"
              headerCounter={queryResults.length}
              items={queryResults.map((r: any) => ({
                key: r.key,
                distance: r.distance?.toFixed(6) ?? "-",
                metadataCount: r.metadata ? Object.keys(r.metadata).length : 0,
              }))}
              columns={[
                { id: "key", header: "Key", cell: (i: any) => i.key, isRowHeader: true },
                { id: "distance", header: "Distance", cell: (i: any) => i.distance },
                { id: "metadata", header: "Metadata fields", cell: (i: any) => i.metadataCount },
              ]}
            />
          )}
        </div>
      )}

      {/* Create Bucket Modal */}
      <Modal
        visible={showCreateBucket}
        onDismiss={() => setShowCreateBucket(false)}
        header="Create Vector Bucket"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateBucket(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createBucket.isPending}
                disabled={!bucketName.trim()}
                onClick={() => {
                  createBucket.mutate(
                    { vectorBucketName: bucketName.trim() },
                    {
                      onSuccess: () => {
                        setShowCreateBucket(false);
                        setBucketName("");
                        showToast("success", `Bucket ${bucketName} created`);
                      },
                      onError: (e: any) => showToast("error", e.message),
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
          {createBucket.isError && (
            <Alert type="error" dismissible>{(createBucket.error as Error)?.message || "Failed"}</Alert>
          )}
          <FormField label="Bucket name">
            <Input
              value={bucketName}
              onChange={({ detail }) => setBucketName(detail.value)}
              placeholder="my-vector-bucket"
            />
          </FormField>
        </Form>
      </Modal>

      {/* Create Index Modal */}
      <Modal
        visible={showCreateIndex}
        onDismiss={() => setShowCreateIndex(false)}
        header="Create Index"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateIndex(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createIndex.isPending}
                disabled={!indexName.trim() || !dimension.trim()}
                onClick={() => {
                  createIndex.mutate(
                    {
                      bucketName: selectedBucket!,
                      indexName: indexName.trim(),
                      dimension: parseInt(dimension),
                      distanceMetric,
                    },
                    {
                      onSuccess: () => {
                        setShowCreateIndex(false);
                        setIndexName("");
                        setDimension("");
                        showToast("success", `Index ${indexName} created`);
                      },
                      onError: (e: any) => showToast("error", e.message),
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
          {createIndex.isError && (
            <Alert type="error" dismissible>{(createIndex.error as Error)?.message || "Failed"}</Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Index name">
              <Input value={indexName} onChange={({ detail }) => setIndexName(detail.value)} placeholder="my-index" />
            </FormField>
            <FormField label="Dimension">
              <Input type="number" value={dimension} onChange={({ detail }) => setDimension(detail.value)} placeholder="128" />
            </FormField>
            <FormField label="Distance metric">
              <Select
                selectedOption={{ label: distanceMetric, value: distanceMetric }}
                onChange={({ detail }) => setDistanceMetric(detail.selectedOption.value || "cosine")}
                options={[
                  { label: "cosine", value: "cosine" },
                  { label: "euclidean", value: "euclidean" },
                  { label: "manhattan", value: "manhattan" },
                ]}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Put Vectors Modal */}
      <Modal
        visible={showPutVectors}
        onDismiss={() => setShowPutVectors(false)}
        header="Put Vectors"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowPutVectors(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={putVectors.isPending}
                disabled={!vectorInput.trim()}
                onClick={() => {
                  try {
                    const vectors = JSON.parse(vectorInput);
                    putVectors.mutate(
                      { bucketName: selectedBucket!, indexName: selectedIndex!, vectors },
                      {
                        onSuccess: () => {
                          setShowPutVectors(false);
                          setVectorInput("[]");
                          showToast("success", "Vectors stored");
                        },
                        onError: (e: any) => showToast("error", e.message),
                      }
                    );
                  } catch {
                    showToast("error", "Invalid JSON");
                  }
                }}
              >
                Put
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {putVectors.isError && (
            <Alert type="error" dismissible>{(putVectors.error as Error)?.message || "Failed"}</Alert>
          )}
          <FormField
            label="Vectors (JSON array)"
            description='[{"key":"v1","data":{"float32":[0.1,0.2]},"metadata":{"label":"test"}}]'
          >
            <Textarea
              value={vectorInput}
              onChange={({ detail }) => setVectorInput(detail.value)}
              rows={6}
              placeholder='[{"key":"v1","data":{"float32":[0.1,0.2]},"metadata":{"label":"test"}}]'
            />
          </FormField>
        </Form>
      </Modal>

      {/* Query Modal */}
      <Modal
        visible={showQuery}
        onDismiss={() => setShowQuery(false)}
        header="Query Vectors"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowQuery(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={queryVectors.isPending}
                disabled={!queryVectorInput.trim()}
                onClick={() => {
                  try {
                    const queryVector = JSON.parse(queryVectorInput);
                    queryVectors.mutate(
                      {
                        bucketName: selectedBucket!,
                        indexName: selectedIndex!,
                        queryVector,
                        topK: parseInt(topK) || 10,
                        returnMetadata: true,
                      },
                      {
                        onSuccess: (data: any) => {
                          setQueryResults(data.vectors || []);
                          setShowQuery(false);
                          showToast("success", `Query returned ${(data.vectors || []).length} results`);
                        },
                        onError: (e: any) => showToast("error", e.message),
                      }
                    );
                  } catch {
                    showToast("error", "Invalid JSON for query vector");
                  }
                }}
              >
                Query
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {queryVectors.isError && (
            <Alert type="error" dismissible>{(queryVectors.error as Error)?.message || "Failed"}</Alert>
          )}
          <SpaceBetween size="m">
            <FormField
              label="Query vector (JSON array)"
              description="e.g. [0.1, 0.2, 0.3]"
            >
              <Input
                value={queryVectorInput}
                onChange={({ detail }) => setQueryVectorInput(detail.value)}
                placeholder="[0.1, 0.2, 0.3]"
              />
            </FormField>
            <FormField label="Top K">
              <Input type="number" value={topK} onChange={({ detail }) => setTopK(detail.value)} placeholder="10" />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
