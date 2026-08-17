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
  useECRScanningConfiguration,
  useECRImageManifest,
  useECRAuthToken,
  type ECRManifestParams,
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

export function ECRDashboard() {
  const { data, isLoading } = useECRRepositories();
  const createRepo = useECRCreateRepository();
  const deleteRepo = useECRDeleteRepository();
  const [showCreate, setShowCreate] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [scanConfigRepo, setScanConfigRepo] = useState<string | null>(null);
  const [manifestRepo, setManifestRepo] = useState<string | null>(null);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const manifestMutation = useECRImageManifest();
  const authTokenQuery = useECRAuthToken();

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <ResourceTable
        resourceName="Repository"
        headerTitle="Repositories"
        headerCounter={data?.total}
        items={(data?.repositories || []).map((r: any) => ({
          name: r.repositoryName,
          uri: r.repositoryUri,
          created: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-",
        }))}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        emptyMessage="No repositories"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => item.name,
            isRowHeader: true,
          },
          { id: "uri", header: "URI", cell: (item: any) => item.uri },
          { id: "created", header: "Created", cell: (item: any) => item.created },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setManifestRepo(item.name)}>
                  Manifest
                </Button>
                <Button variant="link" onClick={() => setScanConfigRepo(item.name)}>
                  Scan config
                </Button>
                <Button variant="link" onClick={() => setShowAuthToken(true)}>
                  Auth token
                </Button>
                <DeleteButton
                  itemName={item.name}
                  resourceType="repository"
                  loading={deleteRepo.isPending && deleteRepo.variables === item.name}
                  onDelete={() => deleteRepo.mutateAsync(item.name)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find repositories by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create repository"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  createRepo.mutate({ name: repoName });
                  setShowCreate(false);
                  setRepoName("");
                }}
                disabled={!repoName}
                loading={createRepo.isPending}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Repository name">
            <Input
              value={repoName}
              onChange={({ detail }) => setRepoName(detail.value)}
              placeholder="my-repo"
            />
          </FormField>
        </Form>
      </Modal>
      <ECRManifestModal repoName={manifestRepo} onDismiss={() => setManifestRepo(null)} manifestMutation={manifestMutation} />
      <ECRAuthTokenModal visible={showAuthToken} onDismiss={() => setShowAuthToken(false)} authTokenQuery={authTokenQuery} />
      <ECRScanConfigModal repoName={scanConfigRepo} onDismiss={() => setScanConfigRepo(null)} />
    </>
  );
}

// ────────────────────────────────────────────────────────
//  ECR — Image manifest modal
// ────────────────────────────────────────────────────────

function ECRManifestModal({
  repoName,
  onDismiss,
  manifestMutation,
}: {
  repoName: string | null;
  onDismiss: () => void;
  manifestMutation: {
    mutate: (params: ECRManifestParams, opts?: { onSuccess?: (d: any) => void; onError?: (e: Error) => void }) => void;
    isPending: boolean;
  };
}) {
  const [tag, setTag] = useState("");
  const [digest, setDigest] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFetch() {
    setError(null);
    setResult(null);
    manifestMutation.mutate(
      { repoName: repoName!, tag: tag.trim() || undefined, digest: digest.trim() || undefined },
      {
        onSuccess: (data) => setResult(data),
        onError: (e) => setError((e as Error)?.message || "Failed to fetch manifest"),
      },
    );
  }

  return (
    <Modal
      visible={repoName !== null}
      onDismiss={onDismiss}
      header={`Image manifest — ${repoName || ""}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleFetch}
              loading={manifestMutation.isPending}
              disabled={!tag.trim() && !digest.trim()}
            >
              Fetch manifest
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <FormField label="Image tag">
          <Input value={tag} onChange={({ detail }) => setTag(detail.value)} placeholder="latest" />
        </FormField>
        <FormField label="Image digest">
          <Input
            value={digest}
            onChange={({ detail }) => setDigest(detail.value)}
            placeholder="sha256:... (alternative to tag)"
          />
        </FormField>
        {result && (
          <Box fontSize="body-s">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {JSON.stringify(result.image || result, null, 2)}
            </pre>
          </Box>
        )}
      </SpaceBetween>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────
//  ECR — Auth token modal
// ────────────────────────────────────────────────────────

function ECRAuthTokenModal({
  visible,
  onDismiss,
  authTokenQuery,
}: {
  visible: boolean;
  onDismiss: () => void;
  authTokenQuery: {
    refetch: () => void;
    data?: { authorizationToken: string | null; expiresAt: string | null; proxyEndpoint: string | null };
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
  };
}) {
  return (
    <Modal visible={visible} onDismiss={onDismiss} header="Registry auth token">
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Use this token to authenticate Docker to the local registry.
        </Box>
        {authTokenQuery.isError && (
          <Alert type="error">
            {(authTokenQuery.error as Error)?.message || "Failed to fetch auth token"}
          </Alert>
        )}
        {authTokenQuery.data && (
          <div>
            <FormField label="Authorization token">
              <Input readOnly value={authTokenQuery.data.authorizationToken || "—"} />
            </FormField>
            <FormField label="Proxy endpoint">
              <Input readOnly value={authTokenQuery.data.proxyEndpoint || "—"} />
            </FormField>
            <FormField label="Expires at">
              <Input readOnly value={authTokenQuery.data.expiresAt || "—"} />
            </FormField>
          </div>
        )}
        <Box float="right">
          <Button loading={authTokenQuery.isFetching} onClick={() => authTokenQuery.refetch()}>
            Fetch token
          </Button>
        </Box>
      </SpaceBetween>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────
//  ECR — Repository scanning configuration modal
// ────────────────────────────────────────────────────────

function ECRScanConfigModal({
  repoName,
  onDismiss,
}: {
  repoName: string | null;
  onDismiss: () => void;
}) {
  const { data, isLoading, isError, error } = useECRScanningConfiguration(repoName);
  const config = data?.scanningConfiguration;

  return (
    <Modal
      visible={!!repoName}
      onDismiss={onDismiss}
      header={`Scanning configuration — ${repoName || ""}`}
      footer={
        <Box float="right">
          <Button variant="primary" onClick={onDismiss}>
            Close
          </Button>
        </Box>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert type="error">{(error as Error)?.message || "Failed to load scanning configuration"}</Alert>
      ) : data?.failure ? (
        <Alert type="warning" header={data.failure.failureCode || "Unavailable"}>
          {data.failure.failureReason || "Scanning configuration is not available for this repository."}
        </Alert>
      ) : !config ? (
        <Box color="text-status-inactive">No scanning configuration for this repository.</Box>
      ) : (
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Scan on push</Box>
            <StatusIndicator type={config.scanOnPush ? "success" : "stopped"}>
              {config.scanOnPush ? "Enabled" : "Disabled"}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Scan frequency</Box>
            <div>{config.scanFrequency || "—"}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Applied scan filters</Box>
            <div>
              {config.appliedScanFilters.length
                ? config.appliedScanFilters
                    .map((f) => `${f.filterType || "?"}: ${f.filter || "*"}`)
                    .join(", ")
                : "—"}
            </div>
          </div>
        </ColumnLayout>
      )}
    </Modal>
  );
}

// ────────────────────────────────────────────────────────
//  ELB
// ────────────────────────────────────────────────────────

