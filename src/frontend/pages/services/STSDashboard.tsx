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

export function STSDashboard() {
  const { data: identity, isLoading } = useSTSCallerIdentity();
  const assumeRole = useSTSAssumeRole();
  const getSessionToken = useSTSGetSessionToken();
  const [activeTab, setActiveTab] = useState("identity");
  const [showAssumeRole, setShowAssumeRole] = useState(false);
  const [showSessionToken, setShowSessionToken] = useState(false);
  const [roleArn, setRoleArn] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [duration, setDuration] = useState("");
  const [assumeResult, setAssumeResult] = useState<any>(null);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [sessionDuration, setSessionDuration] = useState("");

  if (isLoading) return <TableSkeleton />;

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      tabs={[
        {
          id: "identity",
          label: "Caller Identity",
          content: (
            <SpaceBetween size="l">
              <Container header={<Header variant="h2">Current Caller Identity</Header>}>
                <ColumnLayout columns={3} variant="text-grid">
                  <div>
                    <Box variant="h4" color="text-body-secondary">Account</Box>
                    <Box>{identity?.account || "—"}</Box>
                  </div>
                  <div>
                    <Box variant="h4" color="text-body-secondary">User ID</Box>
                    <Box>{identity?.userId || "—"}</Box>
                  </div>
                  <div>
                    <Box variant="h4" color="text-body-secondary">ARN</Box>
                    <Box>{identity?.arn || "—"}</Box>
                  </div>
                </ColumnLayout>
              </Container>
            </SpaceBetween>
          ),
        },
        {
          id: "assume-role",
          label: "Assume Role",
          content: (
            <SpaceBetween size="l">
              <Container
                header={
                  <Header
                    variant="h2"
                    actions={<Button variant="primary" onClick={() => setShowAssumeRole(true)}>Assume role</Button>}
                  >
                    Assume Role
                  </Header>
                }
              >
                {assumeResult ? (
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="h4" color="text-body-secondary">Access Key ID</Box>
                      <Box>{assumeResult.credentials?.accessKeyId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Secret Access Key</Box>
                      <Box>{assumeResult.credentials?.secretAccessKey || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Session Token</Box>
                      <Box>{assumeResult.credentials?.sessionToken || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Expiration</Box>
                      <Box>{assumeResult.credentials?.expiration ? new Date(assumeResult.credentials.expiration).toLocaleString() : "—"}</Box>
                    </div>
                    {assumeResult.assumedRoleUser && (
                      <>
                        <div>
                          <Box variant="h4" color="text-body-secondary">Assumed Role ID</Box>
                          <Box>{assumeResult.assumedRoleUser.assumedRoleId || "—"}</Box>
                        </div>
                        <div>
                          <Box variant="h4" color="text-body-secondary">Assumed Role ARN</Box>
                          <Box>{assumeResult.assumedRoleUser.arn || "—"}</Box>
                        </div>
                      </>
                    )}
                  </ColumnLayout>
                ) : (
                  <Box variant="p" color="text-body-secondary">No role assumed yet. Click "Assume role" to get temporary credentials.</Box>
                )}
              </Container>
              <Modal
                visible={showAssumeRole}
                onDismiss={() => setShowAssumeRole(false)}
                header="Assume role"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowAssumeRole(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        disabled={!roleArn}
                        loading={assumeRole.isPending}
                        onClick={() => {
                          assumeRole.mutate(
                            {
                              roleArn,
                              sessionName: sessionName || undefined,
                              durationSeconds: duration ? parseInt(duration) : undefined,
                            },
                            {
                              onSuccess: (data) => {
                                setAssumeResult(data);
                                setShowAssumeRole(false);
                              },
                            }
                          );
                        }}
                      >
                        Assume
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <SpaceBetween size="m">
                    <FormField label="Role ARN">
                      <Input value={roleArn} onChange={({ detail }) => setRoleArn(detail.value)} placeholder="arn:aws:iam::123456789012:role/my-role" />
                    </FormField>
                    <FormField label="Session name (optional)">
                      <Input value={sessionName} onChange={({ detail }) => setSessionName(detail.value)} placeholder="dashboard-session" />
                    </FormField>
                    <FormField label="Duration seconds (optional)">
                      <Input value={duration} onChange={({ detail }) => setDuration(detail.value)} placeholder="3600" inputMode="numeric" />
                    </FormField>
                  </SpaceBetween>
                </Form>
              </Modal>
            </SpaceBetween>
          ),
        },
        {
          id: "session-token",
          label: "Session Token",
          content: (
            <SpaceBetween size="l">
              <Container
                header={
                  <Header
                    variant="h2"
                    actions={<Button variant="primary" onClick={() => setShowSessionToken(true)}>Get session token</Button>}
                  >
                    Session Token
                  </Header>
                }
              >
                {sessionResult ? (
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="h4" color="text-body-secondary">Access Key ID</Box>
                      <Box>{sessionResult.credentials?.accessKeyId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Secret Access Key</Box>
                      <Box>{sessionResult.credentials?.secretAccessKey || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Session Token</Box>
                      <Box>{sessionResult.credentials?.sessionToken || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="h4" color="text-body-secondary">Expiration</Box>
                      <Box>{sessionResult.credentials?.expiration ? new Date(sessionResult.credentials.expiration).toLocaleString() : "—"}</Box>
                    </div>
                  </ColumnLayout>
                ) : (
                  <Box variant="p" color="text-body-secondary">No session token requested. Click "Get session token" to obtain temporary credentials.</Box>
                )}
              </Container>
              <Modal
                visible={showSessionToken}
                onDismiss={() => setShowSessionToken(false)}
                header="Get session token"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowSessionToken(false)}>Cancel</Button>
                      <Button
                        variant="primary"
                        loading={getSessionToken.isPending}
                        onClick={() => {
                          getSessionToken.mutate(
                            {
                              durationSeconds: sessionDuration ? parseInt(sessionDuration) : undefined,
                            },
                            {
                              onSuccess: (data) => {
                                setSessionResult(data);
                                setShowSessionToken(false);
                              },
                            }
                          );
                        }}
                      >
                        Get token
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Duration seconds (optional)">
                    <Input value={sessionDuration} onChange={({ detail }) => setSessionDuration(detail.value)} placeholder="3600" inputMode="numeric" />
                  </FormField>
                </Form>
              </Modal>
            </SpaceBetween>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  EKS
// ────────────────────────────────────────────────────────

