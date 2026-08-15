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
  useKinesisConsumers,
  useRegisterKinesisConsumer,
  useDeregisterKinesisConsumer,
  useSubscribeToShard,
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

export function KinesisDashboard() {
  const { data, isLoading } = useKinesisStreams();
  const createStream = useCreateKinesisStream();
  const deleteStream = useDeleteKinesisStream();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [shardCount, setShardCount] = useState("1");
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("streams");

  // Shards
  const { data: shardsData } = useKinesisShards(selectedStream);
  const putRecord = usePutKinesisRecord(selectedStream || "");
  const [showPutRecord, setShowPutRecord] = useState(false);
  const [recordData, setRecordData] = useState("");
  const [recordKey, setRecordKey] = useState("");

  // Consumers
  const { data: consumersData } = useKinesisConsumers(selectedStream);
  const registerConsumer = useRegisterKinesisConsumer(selectedStream || "");
  const deregisterConsumer = useDeregisterKinesisConsumer(selectedStream || "");
  const subscribeToShard = useSubscribeToShard(selectedStream || "");
  const [showRegisterConsumer, setShowRegisterConsumer] = useState(false);
  const [consumerName, setConsumerName] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeShardId, setSubscribeShardId] = useState("");
  const [subscribeStartingPos, setSubscribeStartingPos] = useState<string>("TRIM_HORIZON");
  const [subscribeConsumerArn, setSubscribeConsumerArn] = useState("");
  const [subscribeEvents, setSubscribeEvents] = useState<any[] | null>(null);

  if (isLoading) return <TableSkeleton />;

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => {
        setActiveTab(detail.activeTabId);
        if (detail.activeTabId === "streams") {
          setSelectedStream(null);
          setSubscribeEvents(null);
        }
      }}
      tabs={[
        {
          id: "streams",
          label: "Streams",
          content: (
            <>
              <ResourceTable
                resourceName="Stream"
                headerTitle="Kinesis Streams"
                headerCounter={data?.total}
                items={(data?.streams || []).map((s: any) => ({
                  name: s.StreamName,
                  status: s.StreamStatus,
                  shards: s.OpenShardCount || 0,
                  retention: s.RetentionPeriodHours,
                  encryption: s.EncryptionType || "NONE",
                  created: s.StreamCreationTimestamp
                    ? new Date(s.StreamCreationTimestamp).toLocaleDateString()
                    : "-",
                }))}
                loading={isLoading}
                onCreate={() => setShowCreate(true)}
                emptyMessage="No Kinesis streams"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (i: any) => (
                      <Button variant="link" onClick={() => {
                        setSelectedStream(i.name);
                        setActiveTab("detail");
                      }}>
                        {i.name}
                      </Button>
                    ),
                    isRowHeader: true,
                  },
                  { id: "status", header: "Status", cell: (i: any) => i.status },
                  { id: "shards", header: "Open Shards", cell: (i: any) => i.shards },
                  { id: "retention", header: "Retention (hrs)", cell: (i: any) => i.retention },
                  { id: "encryption", header: "Encryption", cell: (i: any) => i.encryption },
                  { id: "created", header: "Created", cell: (i: any) => i.created },
                  {
                    id: "actions",
                    header: "",
                    cell: (i: any) => (
                      <DeleteButton
                        itemName={i.name}
                        resourceType="stream"
                        loading={deleteStream.isPending && deleteStream.variables === i.name}
                        onDelete={() => deleteStream.mutateAsync(i.name)}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find streams by name"
                filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
              />
              <Modal
                visible={showCreate}
                onDismiss={() => setShowCreate(false)}
                header="Create Kinesis stream"
                footer={
                  <Box>
                    <Button
                      variant="primary"
                      loading={createStream.isPending}
                      onClick={() => {
                        createStream
                          .mutateAsync({
                            streamName: name,
                            shardCount: parseInt(shardCount) || 1,
                          })
                          .then(() => {
                            setShowCreate(false);
                            setName("");
                            setShardCount("1");
                          });
                      }}
                    >
                      Create
                    </Button>
                    <Button onClick={() => setShowCreate(false)}>Cancel</Button>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Stream name">
                    <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-stream" />
                  </FormField>
                  <FormField label="Shard count">
                    <Input
                      value={shardCount}
                      onChange={({ detail }) => setShardCount(detail.value)}
                      placeholder="1"
                      type="number"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ),
        },
        {
          id: "detail",
          label: selectedStream ? `Shards: ${selectedStream}` : "Stream Details",
          content: selectedStream ? (
            <>
              <Box margin={{ bottom: "s" }}>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setShowPutRecord(true)}>Put record</Button>
                  <Button onClick={() => setActiveTab("consumers")}>View consumers</Button>
                </SpaceBetween>
              </Box>
              <ResourceTable
                resourceName="Shard"
                headerTitle={`Shards in ${selectedStream}`}
                headerCounter={shardsData?.total}
                items={(shardsData?.shards || []).map((sh: any) => ({
                  id: sh.ShardId,
                  parent: sh.ParentShardId || "-",
                  startHash: sh.HashKeyRange?.StartingHashKey,
                  endHash: sh.HashKeyRange?.EndingHashKey,
                  startSeq: sh.SequenceNumberRange?.StartingSequenceNumber?.slice(0, 20) + "...",
                }))}
                loading={false}
                emptyMessage="No shards"
                columns={[
                  { id: "id", header: "Shard ID", cell: (i: any) => i.id, isRowHeader: true },
                  { id: "parent", header: "Parent", cell: (i: any) => i.parent },
                  { id: "startSeq", header: "Start Sequence", cell: (i: any) => i.startSeq },
                ]}
              />
              <Modal
                visible={showPutRecord}
                onDismiss={() => setShowPutRecord(false)}
                header={`Put record to ${selectedStream}`}
                footer={
                  <Box>
                    <Button
                      variant="primary"
                      loading={putRecord.isPending}
                      onClick={() => {
                        putRecord
                          .mutateAsync({ data: recordData, partitionKey: recordKey })
                          .then(() => {
                            setShowPutRecord(false);
                            setRecordData("");
                            setRecordKey("");
                          });
                      }}
                    >
                      Put record
                    </Button>
                    <Button onClick={() => setShowPutRecord(false)}>Cancel</Button>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Data">
                    <Input
                      value={recordData}
                      onChange={({ detail }) => setRecordData(detail.value)}
                      placeholder="Hello, Kinesis!"
                    />
                  </FormField>
                  <FormField label="Partition key">
                    <Input
                      value={recordKey}
                      onChange={({ detail }) => setRecordKey(detail.value)}
                      placeholder="partition-key"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ) : (
            <Alert type="info">Select a stream to view its shards.</Alert>
          ),
        },
        {
          id: "consumers",
          label: selectedStream ? `Consumers: ${selectedStream}` : "Consumers",
          disabled: !selectedStream,
          content: selectedStream ? (
            <>
              <Box margin={{ bottom: "s" }}>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => { setShowRegisterConsumer(true); setConsumerName(""); }}>
                    Register consumer
                  </Button>
                  <Button onClick={() => { setActiveTab("detail"); }}>Back to shards</Button>
                </SpaceBetween>
              </Box>

              <ResourceTable
                resourceName="Consumer"
                headerTitle={`Consumers for ${selectedStream}`}
                headerCounter={consumersData?.total}
                items={(consumersData?.consumers || []).map((c: any) => ({
                  name: c.ConsumerName,
                  arn: c.ConsumerARN,
                  status: c.ConsumerStatus,
                  created: c.ConsumerCreationTimestamp
                    ? new Date(c.ConsumerCreationTimestamp).toLocaleDateString()
                    : "-",
                  streamArn: c.StreamARN,
                }))}
                loading={false}
                emptyMessage="No consumers registered. Register a consumer to use enhanced fan-out."
                columns={[
                  { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                  { id: "arn", header: "ARN", cell: (i: any) => <span style={{ fontSize: 12 }}>{i.arn}</span> },
                  { id: "status", header: "Status", cell: (i: any) => <StatusIndicator type={i.status === "ACTIVE" ? "success" : "pending"}>{i.status}</StatusIndicator> },
                  { id: "created", header: "Created", cell: (i: any) => i.created },
                  {
                    id: "actions",
                    header: "",
                    cell: (i: any) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          variant="normal"
                          iconName="play"
                          onClick={() => {
                            setSubscribeConsumerArn(i.arn);
                            setSubscribeShardId("");
                            setSubscribeEvents(null);
                            setShowSubscribe(true);
                          }}
                        >
                          Subscribe
                        </Button>
                        <DeleteButton
                          itemName={i.name}
                          resourceType="consumer"
                          loading={deregisterConsumer.isPending && deregisterConsumer.variables === i.name}
                          onDelete={() => deregisterConsumer.mutateAsync(i.name)}
                        />
                      </SpaceBetween>
                    ),
                  },
                ]}
              />

              {/* Register Consumer Modal */}
              <Modal
                visible={showRegisterConsumer}
                onDismiss={() => setShowRegisterConsumer(false)}
                header="Register Stream Consumer"
                footer={
                  <Box>
                    <Button
                      variant="primary"
                      loading={registerConsumer.isPending}
                      onClick={() => {
                        registerConsumer.mutateAsync(consumerName).then(() => {
                          setShowRegisterConsumer(false);
                          setConsumerName("");
                        });
                      }}
                    >
                      Register
                    </Button>
                    <Button onClick={() => setShowRegisterConsumer(false)}>Cancel</Button>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Consumer name">
                    <Input
                      value={consumerName}
                      onChange={({ detail }) => setConsumerName(detail.value)}
                      placeholder="my-consumer"
                    />
                  </FormField>
                </Form>
              </Modal>

              {/* Subscribe to Shard Modal */}
              <Modal
                visible={showSubscribe}
                onDismiss={() => { setShowSubscribe(false); setSubscribeEvents(null); }}
                header={`Subscribe to Shard — ${selectedStream}`}
                size="large"
                footer={
                  <Box>
                    <Button onClick={() => { setShowSubscribe(false); setSubscribeEvents(null); }}>Close</Button>
                  </Box>
                }
              >
                <Form>
                  <FormField
                    label="Shard ID"
                    description="Select a shard to subscribe to"
                  >
                    <Select
                      selectedOption={subscribeShardId
                        ? { label: subscribeShardId, value: subscribeShardId }
                        : { label: "Select a shard...", value: "" }
                      }
                      onChange={({ detail }) =>
                        setSubscribeShardId(detail.selectedOption.value!)
                      }
                      options={(shardsData?.shards || []).map((sh: any) => ({
                        label: sh.ShardId,
                        value: sh.ShardId,
                      }))}
                      placeholder="Select a shard"
                    />
                  </FormField>
                  <FormField label="Starting position">
                    <Select
                      selectedOption={
                        subscribeStartingPos === "LATEST"
                          ? { label: "LATEST", value: "LATEST" }
                          : subscribeStartingPos === "AT_TIMESTAMP"
                          ? { label: "AT_TIMESTAMP", value: "AT_TIMESTAMP" }
                          : { label: "TRIM_HORIZON (oldest)", value: "TRIM_HORIZON" }
                      }
                      onChange={({ detail }) =>
                        setSubscribeStartingPos(detail.selectedOption.value!)
                      }
                      options={[
                        { label: "TRIM_HORIZON (oldest)", value: "TRIM_HORIZON" },
                        { label: "LATEST", value: "LATEST" },
                        { label: "AT_TIMESTAMP", value: "AT_TIMESTAMP" },
                      ]}
                    />
                  </FormField>
                  <Box margin={{ top: "s" }}>
                    <Button
                      variant="primary"
                      loading={subscribeToShard.isPending}
                      disabled={!subscribeShardId}
                      onClick={() => {
                        subscribeToShard
                          .mutateAsync({
                            consumerARN: subscribeConsumerArn,
                            shardId: subscribeShardId,
                            startingPosition: { Type: subscribeStartingPos },
                          })
                          .then((result) => {
                            setSubscribeEvents(result.events);
                          });
                      }}
                    >
                      Fetch records
                    </Button>
                  </Box>

                  {subscribeToShard.isError && (
                    <Alert type="error" header="Subscribe error">
                      {subscribeToShard.error?.message || "Failed to subscribe to shard"}
                    </Alert>
                  )}
                </Form>

                {subscribeEvents !== null && (
                  <Box margin={{ top: "l" }}>
                    <Header variant="h3">
                      Records ({subscribeEvents.length})
                    </Header>
                    {subscribeEvents.length === 0 ? (
                      <Alert type="info">No records received from shard.</Alert>
                    ) : (
                      <Container>
                        <SpaceBetween size="s">
                          {subscribeEvents.map((ev: any, idx: number) => (
                            <Box
                              key={idx}
                              padding="s"
                              variant="awsui-key-label"
                            >
                              <Box variant="awsui-key-label">Record {idx + 1}</Box>
                              <Box><strong>Partition Key:</strong> {ev.partitionKey}</Box>
                              <Box><strong>Sequence:</strong> {ev.sequenceNumber}</Box>
                              <Box><strong>Data (base64):</strong> {ev.data}</Box>
                              {ev.approximateArrivalTimestamp && (
                                <Box><strong>Arrival:</strong> {new Date(ev.approximateArrivalTimestamp).toLocaleString()}</Box>
                              )}
                            </Box>
                          ))}
                        </SpaceBetween>
                      </Container>
                    )}
                  </Box>
                )}
              </Modal>
            </>
          ) : (
            <Alert type="info">Select a stream to view and manage its consumers.</Alert>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  Neptune
// ────────────────────────────────────────────────────────

