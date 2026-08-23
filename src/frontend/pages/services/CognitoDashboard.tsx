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
  useResourceServers,
  useCreateResourceServer,
  useDeleteResourceServer,
  useMfaConfig,
  useSetMfaConfig,
  useAddCustomAttributes,
  useInitiateAuth,
  useAdminInitiateAuth,
  useConfirmSignUp,
  useAdminRespondToAuthChallenge,
  useForgotPassword,
  useConfirmForgotPassword,
  useGetUser,
  useUpdateUserAttributes,
  useDeleteUserAttributes,
  useAddUserPoolClientSecret,
  useDeleteUserPoolClientSecret,
  useUserPoolClientSecrets,
  useCognitoUser,
  useAdminRemoveUserFromGroup,
  useAdminAddUserToGroup,
  useAdminResetUserPassword,
  useUpdateCognitoGroup,
  useUpdateCognitoUserPoolClient,
  useUpdateCognitoUserPool,
  useCognitoTags,
  useTagCognitoUserPool,
  useUntagCognitoUserPool,
  useChangePassword,
  useSignUp,
  useRespondToAuthChallenge,
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

export function CognitoDashboard() {
  const { data, isLoading } = useCognitoUserPools();
  const deletePool = useDeleteCognitoUserPool();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const { data: usersData } = useCognitoUsers(selectedPool);
  const { data: groupsData } = useCognitoGroups(selectedPool);
  const { data: clientsData } = useCognitoUserPoolClients(selectedPool);

  // Advanced tab state & hooks
  const { data: resourceServersData } = useResourceServers(selectedPool);
  const { data: mfaConfigData } = useMfaConfig(selectedPool);
  const createResourceServer = useCreateResourceServer(selectedPool!);
  const deleteResourceServer = useDeleteResourceServer(selectedPool!);
  const setMfaConfig = useSetMfaConfig(selectedPool!);
  const addCustomAttrs = useAddCustomAttributes(selectedPool!);

  const [showCreateResourceServer, setShowCreateResourceServer] = useState(false);
  const [showAddCustomAttrs, setShowAddCustomAttrs] = useState(false);
  const [rsIdentifier, setRsIdentifier] = useState("");
  const [rsName, setRsName] = useState("");
  const [rsScopes, setRsScopes] = useState("");
  const [mfaMode, setMfaMode] = useState("");
  const [customAttrName, setCustomAttrName] = useState("");
  const [customAttrType, setCustomAttrType] = useState("string");

  // Auth Flow Tester state
  const [authFlowClientId, setAuthFlowClientId] = useState("");
  const [authFlowType, setAuthFlowType] = useState("USER_PASSWORD_AUTH");
  const [authFlowUsername, setAuthFlowUsername] = useState("");
  const [authFlowPassword, setAuthFlowPassword] = useState("");
  const [authFlowConfirmationCode, setAuthFlowConfirmationCode] = useState("");
  const [authFlowResult, setAuthFlowResult] = useState<any>(null);
  const [activeAuthFlowType, setActiveAuthFlowType] = useState<
    | "initiate"
    | "admin-initiate"
    | "confirm-sign-up"
    | "admin-respond-challenge"
    | "forgot-password"
    | "confirm-forgot-password"
    | "get-user"
    | "update-user-attributes"
    | "delete-user-attributes"
    | "change-password"
    | "sign-up"
    | "respond-challenge"
  >("initiate");
  const [authFlowAccessToken, setAuthFlowAccessToken] = useState("");
  const [authFlowSession, setAuthFlowSession] = useState("");
  const [authFlowChallengeName, setAuthFlowChallengeName] = useState("NEW_PASSWORD_REQUIRED");
  const [authFlowChallengeResponses, setAuthFlowChallengeResponses] = useState("");
  const [authFlowUserAttributes, setAuthFlowUserAttributes] = useState("");
  const [authFlowSecretHash, setAuthFlowSecretHash] = useState("");
  const [secretsClientId, setSecretsClientId] = useState<string | null>(null);
  const [newClientSecret, setNewClientSecret] = useState("");

  // G.86 state — user detail, group edit, client edit, pool edit, tags
  const [detailUsername, setDetailUsername] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string | null>(null);
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [editGroupRole, setEditGroupRole] = useState("");
  const [editGroupPrecedence, setEditGroupPrecedence] = useState("");
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientRefresh, setEditClientRefresh] = useState("");
  const [showEditPool, setShowEditPool] = useState(false);
  const [editPoolName, setEditPoolName] = useState("");
  const [editPoolMfa, setEditPoolMfa] = useState("");
  const [showPoolTags, setShowPoolTags] = useState(false);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  // G.86 hooks
  const { data: detailUserData, isLoading: detailUserLoading } = useCognitoUser(selectedPool, detailUsername);
  const adminRemoveFromGroup = useAdminRemoveUserFromGroup(selectedPool!);
  const adminAddToGroup = useAdminAddUserToGroup(selectedPool!);
  const [addToGroupUser, setAddToGroupUser] = useState<string | null>(null);
  const [addToGroupName, setAddToGroupName] = useState("");
  const adminResetPassword = useAdminResetUserPassword(selectedPool!);
  const updateCognitoGroup = useUpdateCognitoGroup(selectedPool!);
  const updateCognitoClient = useUpdateCognitoUserPoolClient(selectedPool!);
  const updateCognitoPool = useUpdateCognitoUserPool(selectedPool!);
  const { data: poolTagsData } = useCognitoTags(selectedPool);
  const tagPool = useTagCognitoUserPool(selectedPool!);
  const untagPool = useUntagCognitoUserPool(selectedPool!);
  const changePassword = useChangePassword();
  const signUp = useSignUp();
  const respondChallenge = useRespondToAuthChallenge();
  const [flowPreviousPassword, setFlowPreviousPassword] = useState("");
  const [flowProposedPassword, setFlowProposedPassword] = useState("");
  const [flowNewPassword, setFlowNewPassword] = useState("");

  const initiateAuth = useInitiateAuth(selectedPool!);
  const adminInitiateAuth = useAdminInitiateAuth(selectedPool!);
  const confirmSignUp = useConfirmSignUp(selectedPool!);
  const adminRespondChallenge = useAdminRespondToAuthChallenge(selectedPool!);
  const forgotPassword = useForgotPassword(selectedPool!);
  const confirmForgotPassword = useConfirmForgotPassword(selectedPool!);
  const getUser = useGetUser(selectedPool!);
  const updateUserAttributes = useUpdateUserAttributes(selectedPool!);
  const deleteUserAttributes = useDeleteUserAttributes(selectedPool!);
  const addClientSecret = useAddUserPoolClientSecret(selectedPool!);
  const deleteClientSecret = useDeleteUserPoolClientSecret(selectedPool!);
  const { data: clientSecretsData, isLoading: clientSecretsLoading } = useUserPoolClientSecrets(
    selectedPool,
    secretsClientId
  );

  if (isLoading) return <TableSkeleton />;

  if (selectedPool) {
    return (
      <>
        <Box margin={{ bottom: "s" }}>
          <SpaceBetween direction="horizontal" size="xs">
            <Button iconName="arrow-left" onClick={() => setSelectedPool(null)}>
              Back to user pools
            </Button>
            <Button variant="link" onClick={() => {
              setShowEditPool(true);
              setEditPoolName(data?.userPools?.find((p: any) => p.Id === selectedPool)?.Name || "");
              setEditPoolMfa(data?.userPools?.find((p: any) => p.Id === selectedPool)?.Status || "");
            }}>
              Edit pool
            </Button>
            <Button variant="link" onClick={() => setShowPoolTags(true)}>
              Tags
            </Button>
          </SpaceBetween>
        </Box>
        <Tabs
          tabs={[
            {
              id: "users",
              label: "Users",
              content: (
                <>
                <ResourceTable
                  resourceName="User"
                  headerTitle={`Users in ${selectedPool}`}
                  headerCounter={usersData?.total}
                  items={(usersData?.users || []).map((u: any) => ({
                    username: u.Username,
                    status: u.UserStatus,
                    enabled: u.Enabled,
                    created: u.UserCreateDate
                      ? new Date(u.UserCreateDate * 1000).toLocaleDateString()
                      : "-",
                  }))}
                  loading={false}
                  emptyMessage="No users"
                  columns={[
                    { id: "username", header: "Username", cell: (i: any) => i.username, isRowHeader: true },
                    { id: "status", header: "Status", cell: (i: any) => i.status },
                    { id: "enabled", header: "Enabled", cell: (i: any) => (i.enabled ? "Yes" : "No") },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: any) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => { setAddToGroupUser(i.username); setAddToGroupName(""); }}>
                            Add to group
                          </Button>
                          <Button variant="link" onClick={() => setDetailUsername(i.username)}>
                            View
                          </Button>
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  filterEnabled
                  filterPlaceholder="Find users"
                  filterFunction={(i: any, s: string) => i.username.toLowerCase().includes(s.toLowerCase())}
                />
      <Modal
        visible={!!addToGroupUser}
        onDismiss={() => setAddToGroupUser(null)}
        header={`Add ${addToGroupUser || ""} to group`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setAddToGroupUser(null)}>Cancel</Button>
              <Button
                variant="primary"
                loading={adminAddToGroup.isPending}
                disabled={!addToGroupName.trim()}
                onClick={() => {
                  adminAddToGroup.mutate(
                    { username: addToGroupUser!, groupName: addToGroupName.trim() },
                    { onSuccess: () => setAddToGroupUser(null) }
                  );
                }}
              >
                Add
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {adminAddToGroup.isError && (
            <Alert type="error" dismissible>
              {(adminAddToGroup.error as Error)?.message || "Failed to add user to group"}
            </Alert>
          )}
          <FormField label="Group name">
            <Input value={addToGroupName} onChange={({ detail }) => setAddToGroupName(detail.value)} placeholder="admins" />
          </FormField>
        </Form>
      </Modal>
                </>
      
              ),
            },
            {
              id: "groups",
              label: "Groups",
              content: (
                <ResourceTable
                  resourceName="Group"
                  headerTitle={`Groups in ${selectedPool}`}
                  headerCounter={groupsData?.total}
                  items={(groupsData?.groups || []).map((g: any) => ({
                    name: g.GroupName,
                    description: g.Description || "-",
                    precedence: g.Precedence ?? "-",
                    role: g.RoleArn || "-",
                  }))}
                  loading={false}
                  emptyMessage="No groups"
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                    { id: "description", header: "Description", cell: (i: any) => i.description },
                    { id: "precedence", header: "Precedence", cell: (i: any) => i.precedence },
                    { id: "role", header: "Role ARN", cell: (i: any) => i.role },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: any) => (
                        <Button
                          variant="link"
                          onClick={() => {
                            setEditGroupName(i.name);
                            setEditGroupDesc(i.description === "-" ? "" : i.description);
                            setEditGroupRole(i.role === "-" ? "" : i.role);
                            setEditGroupPrecedence(i.precedence === "-" ? "" : String(i.precedence));
                          }}
                        >
                          Edit
                        </Button>
                      ),
                    },
                  ]}
                  filterEnabled
                  filterPlaceholder="Find groups"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                />
              ),
            },
            {
              id: "clients",
              label: "App Clients",
              content: (
                <ResourceTable
                  resourceName="Client"
                  headerTitle={`App Clients in ${selectedPool}`}
                  headerCounter={clientsData?.total}
                  items={(clientsData?.clients || []).map((cl: any) => ({
                    id: cl.ClientId,
                    name: cl.ClientName,
                    created: cl.CreationDate
                      ? new Date(cl.CreationDate * 1000).toLocaleDateString()
                      : "-",
                  }))}
                  loading={false}
                  emptyMessage="No app clients"
                  columns={[
                    { id: "id", header: "Client ID", cell: (i: any) => i.id, isRowHeader: true },
                    { id: "name", header: "Name", cell: (i: any) => i.name },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                    {
                      id: "actions",
                      header: "Actions",
                      cell: (i: any) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            variant="link"
                            onClick={() => {
                              setEditClientId(i.id);
                              setEditClientName(i.name);
                              setEditClientRefresh("");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => {
                              setSecretsClientId(i.id);
                              setNewClientSecret("");
                            }}
                          >
                            Manage Secrets
                          </Button>
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  filterEnabled
                  filterPlaceholder="Find clients"
                  filterFunction={(i: any, s: string) =>
                    (i.name || "").toLowerCase().includes(s.toLowerCase())
                  }
                />
              ),
            },
            {
              id: "auth-flows",
              label: "Auth Flows",
              content: (
                <SpaceBetween size="l">
                  <Container header={<Header variant="h3">Authentication Flow Tester</Header>}>
                    <SpaceBetween size="s">
                      <FormField label="Flow Operation">
                        <Select
                          selectedOption={{ label: activeAuthFlowType, value: activeAuthFlowType }}
                          onChange={({ detail }) => setActiveAuthFlowType(detail.selectedOption.value as any)}
                          options={[
                            { label: "Initiate Auth", value: "initiate" },
                            { label: "Admin Initiate Auth", value: "admin-initiate" },
                            { label: "Confirm Sign Up", value: "confirm-sign-up" },
                            { label: "Admin Respond to Challenge", value: "admin-respond-challenge" },
                            { label: "Forgot Password", value: "forgot-password" },
                            { label: "Confirm Forgot Password", value: "confirm-forgot-password" },
                            { label: "Get User", value: "get-user" },
                            { label: "Update User Attributes", value: "update-user-attributes" },
                            { label: "Delete User Attributes", value: "delete-user-attributes" },
                            { label: "Change Password", value: "change-password" },
                            { label: "Sign Up", value: "sign-up" },
                            { label: "Respond to Challenge", value: "respond-challenge" },
                          ]}
                          selectedAriaLabel="Selected flow type"
                        />
                      </FormField>
                      {activeAuthFlowType === "initiate" || activeAuthFlowType === "admin-initiate" ? (
                        <FormField label="Auth Flow">
                          <Select
                            selectedOption={{ label: authFlowType, value: authFlowType }}
                            onChange={({ detail }) => setAuthFlowType(detail.selectedOption.value!)}
                            options={[
                              { label: "USER_PASSWORD_AUTH", value: "USER_PASSWORD_AUTH" },
                              { label: "USER_SRP_AUTH", value: "USER_SRP_AUTH" },
                              { label: "CUSTOM_AUTH", value: "CUSTOM_AUTH" },
                              { label: "REFRESH_TOKEN_AUTH", value: "REFRESH_TOKEN_AUTH" },
                            ]}
                            selectedAriaLabel="Selected auth flow"
                          />
                        </FormField>
                      ) : null}
                      {activeAuthFlowType !== "get-user" &&
                        activeAuthFlowType !== "update-user-attributes" &&
                        activeAuthFlowType !== "delete-user-attributes" &&
                        activeAuthFlowType !== "change-password" && (
                        <FormField label="Client ID" description="App client ID for the selected user pool">
                          <Input
                            value={authFlowClientId}
                            onChange={({ detail }) => setAuthFlowClientId(detail.value)}
                            placeholder="Client ID"
                          />
                        </FormField>
                      )}
                      {activeAuthFlowType !== "get-user" &&
                        activeAuthFlowType !== "update-user-attributes" &&
                        activeAuthFlowType !== "delete-user-attributes" &&
                        activeAuthFlowType !== "change-password" && (
                        <FormField label="Username">
                          <Input
                            value={authFlowUsername}
                            onChange={({ detail }) => setAuthFlowUsername(detail.value)}
                            placeholder="Username"
                          />
                        </FormField>
                      )}
                      {(activeAuthFlowType === "initiate" ||
                        activeAuthFlowType === "admin-initiate" ||
                        activeAuthFlowType === "confirm-forgot-password" ||
                        activeAuthFlowType === "sign-up") && (
                        <FormField label="Password">
                          <Input
                            type="password"
                            value={authFlowPassword}
                            onChange={({ detail }) => setAuthFlowPassword(detail.value)}
                            placeholder="Password"
                          />
                        </FormField>
                      )}
                      {(activeAuthFlowType === "confirm-sign-up" ||
                        activeAuthFlowType === "confirm-forgot-password") && (
                        <FormField label="Confirmation Code">
                          <Input
                            value={authFlowConfirmationCode}
                            onChange={({ detail }) => setAuthFlowConfirmationCode(detail.value)}
                            placeholder="123456"
                          />
                        </FormField>
                      )}
                      {(activeAuthFlowType === "admin-respond-challenge" ||
                        activeAuthFlowType === "respond-challenge") && (
                        <>
                          <FormField label="Challenge Name">
                            <Select
                              selectedOption={{ label: authFlowChallengeName, value: authFlowChallengeName }}
                              onChange={({ detail }) => setAuthFlowChallengeName(detail.selectedOption.value!)}
                              options={[
                                { label: "NEW_PASSWORD_REQUIRED", value: "NEW_PASSWORD_REQUIRED" },
                                { label: "SMS_MFA", value: "SMS_MFA" },
                                { label: "SOFTWARE_TOKEN_MFA", value: "SOFTWARE_TOKEN_MFA" },
                                { label: "SELECT_MFA_TYPE", value: "SELECT_MFA_TYPE" },
                                { label: "CUSTOM_CHALLENGE", value: "CUSTOM_CHALLENGE" },
                              ]}
                              selectedAriaLabel="Selected challenge name"
                            />
                          </FormField>
                          <FormField label="Session">
                            <Input
                              value={authFlowSession}
                              onChange={({ detail }) => setAuthFlowSession(detail.value)}
                              placeholder="Session string from previous challenge"
                            />
                          </FormField>
                          <FormField label="Challenge Responses (JSON)">
                            <Textarea
                              value={authFlowChallengeResponses}
                              onChange={({ detail }) => setAuthFlowChallengeResponses(detail.value)}
                              placeholder='{"NEW_PASSWORD": "Password123!"}'
                            />
                          </FormField>
                        </>
                      )}
                      {(activeAuthFlowType === "get-user" ||
                        activeAuthFlowType === "update-user-attributes" ||
                        activeAuthFlowType === "delete-user-attributes" ||
                        activeAuthFlowType === "change-password") && (
                        <FormField label="Access Token">
                          <Input
                            value={authFlowAccessToken}
                            onChange={({ detail }) => setAuthFlowAccessToken(detail.value)}
                            placeholder="Access token from successful authentication"
                          />
                        </FormField>
                      )}
                      {activeAuthFlowType === "change-password" && (
                        <>
                          <FormField label="Previous Password">
                            <Input
                              type="password"
                              value={flowPreviousPassword}
                              onChange={({ detail }) => setFlowPreviousPassword(detail.value)}
                              placeholder="Current password"
                            />
                          </FormField>
                          <FormField label="Proposed Password">
                            <Input
                              type="password"
                              value={flowProposedPassword}
                              onChange={({ detail }) => setFlowProposedPassword(detail.value)}
                              placeholder="New password"
                            />
                          </FormField>
                        </>
                      )}
                      {activeAuthFlowType === "update-user-attributes" && (
                        <FormField label="User Attributes (JSON)">
                          <Textarea
                            value={authFlowUserAttributes}
                            onChange={({ detail }) => setAuthFlowUserAttributes(detail.value)}
                            placeholder='[{"Name": "email", "Value": "user@example.com"}]'
                          />
                        </FormField>
                      )}
                      {activeAuthFlowType === "delete-user-attributes" && (
                        <FormField label="Attribute Names (comma-separated)">
                          <Input
                            value={authFlowUserAttributes}
                            onChange={({ detail }) => setAuthFlowUserAttributes(detail.value)}
                            placeholder="email, phone_number"
                          />
                        </FormField>
                      )}
                      {(activeAuthFlowType === "confirm-sign-up" ||
                        activeAuthFlowType === "forgot-password" ||
                        activeAuthFlowType === "confirm-forgot-password" ||
                        activeAuthFlowType === "sign-up") && (
                        <FormField label="Secret Hash (optional)">
                          <Input
                            value={authFlowSecretHash}
                            onChange={({ detail }) => setAuthFlowSecretHash(detail.value)}
                            placeholder="Secret hash for client with secret"
                          />
                        </FormField>
                      )}
                      <Button
                        variant="primary"
                        loading={
                          initiateAuth.isPending ||
                          adminInitiateAuth.isPending ||
                          confirmSignUp.isPending ||
                          adminRespondChallenge.isPending ||
                          forgotPassword.isPending ||
                          confirmForgotPassword.isPending ||
                          getUser.isPending ||
                          updateUserAttributes.isPending ||
                          deleteUserAttributes.isPending ||
                          changePassword.isPending ||
                          signUp.isPending ||
                          respondChallenge.isPending
                        }
                        disabled={
                          // The flow-operation Select offers exactly these twelve types — the object
                          // lookup below covers every one, so no fallback arm exists.
                          ({
                            initiate: !authFlowClientId || !authFlowUsername || !authFlowPassword,
                            "admin-initiate": !authFlowClientId || !authFlowUsername || !authFlowPassword,
                            "confirm-sign-up": !authFlowClientId || !authFlowUsername || !authFlowConfirmationCode,
                            "admin-respond-challenge": !authFlowClientId || !authFlowChallengeName,
                            "forgot-password": !authFlowClientId || !authFlowUsername,
                            "confirm-forgot-password": !authFlowClientId || !authFlowUsername || !authFlowConfirmationCode || !authFlowPassword,
                            "get-user": !authFlowAccessToken,
                            "delete-user-attributes": !authFlowAccessToken,
                            "update-user-attributes": !authFlowAccessToken || !authFlowUserAttributes,
                            "change-password": !authFlowAccessToken || !flowPreviousPassword || !flowProposedPassword,
                            "sign-up": !authFlowClientId || !authFlowUsername || !authFlowPassword,
                            "respond-challenge": !authFlowClientId || !authFlowChallengeName,
                          } as Record<string, boolean>)[activeAuthFlowType]
                        }
                        onClick={async () => {
                          setAuthFlowResult(null);
                          try {
                            let result: any;
                            if (activeAuthFlowType === "initiate") {
                              result = await initiateAuth.mutateAsync({
                                clientId: authFlowClientId,
                                authFlow: authFlowType,
                                authParameters: { USERNAME: authFlowUsername, PASSWORD: authFlowPassword },
                              });
                            } else if (activeAuthFlowType === "admin-initiate") {
                              result = await adminInitiateAuth.mutateAsync({
                                clientId: authFlowClientId,
                                authFlow: authFlowType,
                                authParameters: { USERNAME: authFlowUsername, PASSWORD: authFlowPassword },
                              });
                            } else if (activeAuthFlowType === "confirm-sign-up") {
                              result = await confirmSignUp.mutateAsync({
                                clientId: authFlowClientId,
                                username: authFlowUsername,
                                confirmationCode: authFlowConfirmationCode,
                                secretHash: authFlowSecretHash || undefined,
                              });
                            } else if (activeAuthFlowType === "admin-respond-challenge") {
                              const challengeResponses = authFlowChallengeResponses.trim()
                                ? JSON.parse(authFlowChallengeResponses)
                                : undefined;
                              result = await adminRespondChallenge.mutateAsync({
                                clientId: authFlowClientId,
                                challengeName: authFlowChallengeName,
                                challengeResponses,
                                session: authFlowSession || undefined,
                              });
                            } else if (activeAuthFlowType === "forgot-password") {
                              result = await forgotPassword.mutateAsync({
                                clientId: authFlowClientId,
                                username: authFlowUsername,
                                secretHash: authFlowSecretHash || undefined,
                              });
                            } else if (activeAuthFlowType === "confirm-forgot-password") {
                              result = await confirmForgotPassword.mutateAsync({
                                clientId: authFlowClientId,
                                username: authFlowUsername,
                                confirmationCode: authFlowConfirmationCode,
                                password: authFlowPassword,
                                secretHash: authFlowSecretHash || undefined,
                              });
                            } else if (activeAuthFlowType === "get-user") {
                              result = await getUser.mutateAsync({ accessToken: authFlowAccessToken });
                            } else if (activeAuthFlowType === "update-user-attributes") {
                              const userAttributes = JSON.parse(authFlowUserAttributes);
                              result = await updateUserAttributes.mutateAsync({
                                accessToken: authFlowAccessToken,
                                userAttributes,
                              });
                            } else if (activeAuthFlowType === "change-password") {
                              result = await changePassword.mutateAsync({
                                accessToken: authFlowAccessToken,
                                previousPassword: flowPreviousPassword,
                                proposedPassword: flowProposedPassword,
                              });
                            } else if (activeAuthFlowType === "sign-up") {
                              result = await signUp.mutateAsync({
                                clientId: authFlowClientId,
                                username: authFlowUsername,
                                password: authFlowPassword,
                                secretHash: authFlowSecretHash || undefined,
                              });
                            } else if (activeAuthFlowType === "respond-challenge") {
                              const challengeResponses = authFlowChallengeResponses.trim()
                                ? JSON.parse(authFlowChallengeResponses)
                                : undefined;
                              result = await respondChallenge.mutateAsync({
                                clientId: authFlowClientId,
                                challengeName: authFlowChallengeName,
                                challengeResponses,
                                session: authFlowSession || undefined,
                              });
                            } else {
                              // delete-user-attributes — the only flow type left unhandled above
                              const userAttributeNames = authFlowUserAttributes
                                .split(/[,\n]+/)
                                .map((s: string) => s.trim())
                                .filter(Boolean);
                              result = await deleteUserAttributes.mutateAsync({
                                accessToken: authFlowAccessToken,
                                userAttributeNames,
                              });
                            }
                            setAuthFlowResult(result);
                          } catch (err: any) {
                            setAuthFlowResult({ error: err?.message || "Auth flow failed" });
                          }
                        }}
                      >
                        Run Flow
                      </Button>

                      {authFlowResult && (
                        <Box padding="s">
                          <code>
                            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                              {JSON.stringify(authFlowResult, null, 2)}
                            </pre>
                          </code>
                        </Box>
                      )}
                    </SpaceBetween>
                  </Container>
                </SpaceBetween>
              ),
            },
            {
              id: "advanced",
              label: "Advanced",
              content: (
                <SpaceBetween size="l">
                  {/* Resource Servers */}
                  <Container
                    header={
                      <Header
                        variant="h3"
                        actions={
                          <Button
                            iconName="add-plus"
                            onClick={() => {
                              setRsIdentifier("");
                              setRsName("");
                              setRsScopes("");
                              setShowCreateResourceServer(true);
                            }}
                          >
                            Create Resource Server
                          </Button>
                        }
                      >
                        Resource Servers
                      </Header>
                    }
                  >
                    {!resourceServersData?.resourceServers?.length ? (
                      <Box padding="m" textAlign="center" color="text-status-inactive">
                        No resource servers found
                      </Box>
                    ) : (
                      <SpaceBetween size="xs">
                        {resourceServersData.resourceServers!.map((rs: any) => (
                          <Box key={rs.Identifier} padding={{ vertical: "xs" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <strong>{rs.Name}</strong>
                                <Box variant="small" color="text-body-secondary">
                                  {rs.Identifier}
                                  {rs.Scopes?.length ? ` — ${rs.Scopes.length} scope(s)` : ""}
                                </Box>
                              </div>
                              <DeleteButton
                                itemName={rs.Name || rs.Identifier}
                                resourceType="resource server"
                                loading={deleteResourceServer.isPending && deleteResourceServer.variables === rs.Identifier}
                                onDelete={() => deleteResourceServer.mutateAsync(rs.Identifier)}
                              />
                            </div>
                          </Box>
                        ))}
                      </SpaceBetween>
                    )}
                  </Container>

                  {/* MFA Config */}
                  <Container header={<Header variant="h3">MFA Configuration</Header>}>
                    <SpaceBetween size="s">
                      <div>
                        <Box variant="awsui-key-label">Current MFA Setting</Box>
                        <Box margin={{ top: "xxs" }}>
                          <StatusIndicator type={mfaConfigData?.mfaConfiguration && mfaConfigData.mfaConfiguration !== "OFF" ? "success" : "info"}>
                            {mfaConfigData?.mfaConfiguration || "OFF"}
                          </StatusIndicator>
                        </Box>
                      </div>
                      <FormField label="Change MFA Mode">
                        <Select
                          selectedOption={{ label: mfaMode || "Select", value: mfaMode || "" }}
                          onChange={({ detail }) => setMfaMode(detail.selectedOption.value!)}
                          options={[
                            { label: "OFF", value: "OFF" },
                            { label: "ON", value: "ON" },
                            { label: "OPTIONAL", value: "OPTIONAL" },
                          ]}
                          placeholder="Select MFA mode"
                          selectedAriaLabel="Selected MFA mode"
                        />
                      </FormField>
                      <Button
                        variant="primary"
                        disabled={!mfaMode}
                        loading={setMfaConfig.isPending}
                        onClick={() => { setMfaConfig.mutateAsync({ mfaConfiguration: mfaMode }); setMfaMode(""); }}
                      >
                        Update MFA
                      </Button>
                    </SpaceBetween>
                  </Container>

                  {/* Custom Attributes */}
                  <Container
                    header={
                      <Header
                        variant="h3"
                        actions={
                          <Button
                            iconName="add-plus"
                            onClick={() => {
                              setCustomAttrName("");
                              setCustomAttrType("string");
                              setShowAddCustomAttrs(true);
                            }}
                          >
                            Add Custom Attribute
                          </Button>
                        }
                      >
                        Custom Attributes
                      </Header>
                    }
                  >
                    <Box padding="m" textAlign="center" color="text-status-inactive">
                      Custom attributes defined during pool creation. Use the button above to add new ones.
                    </Box>
                  </Container>
                </SpaceBetween>
              ),
            },
          ]}
        />

        {/* Create Resource Server Modal */}
        <Modal
          visible={showCreateResourceServer}
          onDismiss={() => setShowCreateResourceServer(false)}
          header="Create Resource Server"
        >
          <Form
            actions={
              <>
                <Button variant="link" onClick={() => setShowCreateResourceServer(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={createResourceServer.isPending}
                  disabled={!rsIdentifier || !rsName}
                  onClick={async () => {
                    const scopes = rsScopes
                      ? rsScopes.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean).map((s) => ({ ScopeName: s, ScopeDescription: s }))
                      : [];
                    await createResourceServer.mutateAsync({ identifier: rsIdentifier, name: rsName, scopes });
                    setShowCreateResourceServer(false);
                  }}
                >
                  Create
                </Button>
              </>
            }
          >
            <SpaceBetween size="s">
              <FormField label="Identifier" description="A unique resource server identifier (e.g., https://api.example.com)">
                <Input value={rsIdentifier} onChange={({ detail }) => setRsIdentifier(detail.value)} placeholder="https://api.example.com" />
              </FormField>
              <FormField label="Name">
                <Input value={rsName} onChange={({ detail }) => setRsName(detail.value)} placeholder="My API" />
              </FormField>
              <FormField label="Scopes" description="Comma-separated scope names">
                <Input value={rsScopes} onChange={({ detail }) => setRsScopes(detail.value)} placeholder="read, write, admin" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* Add Custom Attributes Modal */}
        <Modal
          visible={showAddCustomAttrs}
          onDismiss={() => setShowAddCustomAttrs(false)}
          header="Add Custom Attributes"
        >
          <Form
            actions={
              <>
                <Button variant="link" onClick={() => setShowAddCustomAttrs(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={addCustomAttrs.isPending}
                  disabled={!customAttrName}
                  onClick={async () => {
                    await addCustomAttrs.mutateAsync({
                      customAttributes: [{ Name: customAttrName, AttributeDataType: customAttrType, Mutable: true, Required: false }],
                    });
                    setShowAddCustomAttrs(false);
                  }}
                >
                  Add
                </Button>
              </>
            }
          >
            <SpaceBetween size="s">
              <FormField label="Attribute Name" description="Must start with 'custom:' prefix">
                <Input value={customAttrName} onChange={({ detail }) => setCustomAttrName(detail.value)} placeholder="custom:myAttribute" />
              </FormField>
              <FormField label="Data Type">
                <Select
                  selectedOption={{ label: customAttrType, value: customAttrType }}
                  onChange={({ detail }) => setCustomAttrType(detail.selectedOption.value!)}
                  options={[
                    { label: "String", value: "string" },
                    { label: "Number", value: "number" },
                    { label: "Boolean", value: "boolean" },
                    { label: "DateTime", value: "datetime" },
                  ]}
                  selectedAriaLabel="Selected data type"
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* Client Secrets Modal */}
        <Modal
          visible={!!secretsClientId}
          onDismiss={() => setSecretsClientId(null)}
          header={`Client Secrets for ${secretsClientId || ""}`}
        >
          <SpaceBetween size="s">
            {clientSecretsLoading ? (
              <Spinner />
            ) : !clientSecretsData?.secrets?.length ? (
              <Box padding="m" textAlign="center" color="text-status-inactive">
                No client secrets
              </Box>
            ) : (
              <SpaceBetween size="xs">
                {clientSecretsData.secrets.map((secret: any) => (
                  <Box key={secret.ClientSecretId || secret.ClientSecretIdentifier || secret.SecretId} padding="s">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Box variant="small">{secret.ClientSecretId || secret.ClientSecretIdentifier || secret.SecretId}</Box>
                        <Box variant="small" color="text-body-secondary">
                          Created: {secret.CreationDate ? new Date(secret.CreationDate * 1000).toLocaleDateString() : "-"}
                        </Box>
                      </div>
                      <DeleteButton
                        itemName={secret.ClientSecretId || secret.ClientSecretIdentifier || secret.SecretId}
                        resourceType="client secret"
                        loading={deleteClientSecret.isPending}
                        onDelete={() =>
                          deleteClientSecret.mutateAsync({
                            clientId: secretsClientId!,
                            secretId: secret.ClientSecretId || secret.ClientSecretIdentifier || secret.SecretId,
                          })
                        }
                      />
                    </div>
                  </Box>
                ))}
              </SpaceBetween>
            )}
            <FormField label="New Secret Value (optional)">
              <Input
                type="password"
                value={newClientSecret}
                onChange={({ detail }) => setNewClientSecret(detail.value)}
                placeholder="Leave blank to let Cognito generate a secret"
              />
            </FormField>
            <Button
              variant="primary"
              iconName="add-plus"
              loading={addClientSecret.isPending}
              disabled={!secretsClientId}
              onClick={async () => {
                await addClientSecret.mutateAsync({
                  clientId: secretsClientId!,
                  clientSecret: newClientSecret || undefined,
                });
                setNewClientSecret("");
              }}
            >
              Add Secret
            </Button>
          </SpaceBetween>
        </Modal>

        {/* G.86 — User Detail Modal */}
        <Modal
          visible={!!detailUsername}
          onDismiss={() => setDetailUsername(null)}
          header={`User: ${detailUsername || ""}`}
          size="large"
        >
          {detailUserLoading ? (
            <Spinner />
          ) : detailUserData?.user ? (
            <SpaceBetween size="s">
              <ColumnLayout columns={2} variant="text-grid">
                <div><b>Username:</b> {detailUserData.user.Username}</div>
                <div><b>Status:</b> {detailUserData.user.UserStatus || "-"}</div>
                <div><b>Enabled:</b> {detailUserData.user.Enabled ? "Yes" : "No"}</div>
                <div><b>Created:</b> {detailUserData.user.UserCreateDate ? new Date(detailUserData.user.UserCreateDate * 1000).toLocaleString() : "-"}</div>
              </ColumnLayout>
              <Container header={<Header variant="h3">Attributes</Header>}>
                {(detailUserData.user.Attributes || []).length === 0 ? (
                  <Box color="text-body-secondary">No attributes</Box>
                ) : (
                  <SpaceBetween size="xs">
                    {detailUserData.user.Attributes.map((a: any) => (
                      <Box key={a.Name} variant="small"><b>{a.Name}:</b> {a.Value}</Box>
                    ))}
                  </SpaceBetween>
                )}
              </Container>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  loading={adminResetPassword.isPending}
                  onClick={async () => {
                    await adminResetPassword.mutateAsync({ username: detailUsername! });
                  }}
                >
                  Reset password
                </Button>
                <Button variant="link" onClick={() => setDetailUsername(null)}>
                  Close
                </Button>
              </SpaceBetween>
            </SpaceBetween>
          ) : (
            <Box color="text-body-secondary">User not found</Box>
          )}
        </Modal>

        {/* G.86 — Edit Group Modal */}
        <Modal
          visible={!!editGroupName}
          onDismiss={() => setEditGroupName(null)}
          header={`Edit group: ${editGroupName || ""}`}
        >
          <Form
            actions={
              <>
                <Button variant="link" onClick={() => setEditGroupName(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={updateCognitoGroup.isPending}
                  onClick={async () => {
                    await updateCognitoGroup.mutateAsync({
                      groupName: editGroupName!,
                      description: editGroupDesc || undefined,
                      roleArn: editGroupRole || undefined,
                      precedence: editGroupPrecedence ? Number(editGroupPrecedence) : undefined,
                    });
                    setEditGroupName(null);
                  }}
                >
                  Save
                </Button>
              </>
            }
          >
            <SpaceBetween size="s">
              <FormField label="Description">
                <Input value={editGroupDesc} onChange={({ detail }) => setEditGroupDesc(detail.value)} placeholder="Group description" />
              </FormField>
              <FormField label="Role ARN">
                <Input value={editGroupRole} onChange={({ detail }) => setEditGroupRole(detail.value)} placeholder="arn:aws:iam::123:role/example" />
              </FormField>
              <FormField label="Precedence">
                <Input value={editGroupPrecedence} onChange={({ detail }) => setEditGroupPrecedence(detail.value)} placeholder="0" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* G.86 — Edit Client Modal */}
        <Modal
          visible={!!editClientId}
          onDismiss={() => setEditClientId(null)}
          header={`Edit client: ${editClientName || ""}`}
        >
          <Form
            actions={
              <>
                <Button variant="link" onClick={() => setEditClientId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={updateCognitoClient.isPending}
                  onClick={async () => {
                    await updateCognitoClient.mutateAsync({
                      clientId: editClientId!,
                      name: editClientName || undefined,
                      refreshTokenValidity: editClientRefresh ? Number(editClientRefresh) : undefined,
                    });
                    setEditClientId(null);
                  }}
                >
                  Save
                </Button>
              </>
            }
          >
            <SpaceBetween size="s">
              <FormField label="Client name">
                <Input value={editClientName} onChange={({ detail }) => setEditClientName(detail.value)} />
              </FormField>
              <FormField label="Refresh token validity (days)">
                <Input value={editClientRefresh} onChange={({ detail }) => setEditClientRefresh(detail.value)} placeholder="30" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

      {/* G.86 — Edit Pool Modal */}
        <Modal
          visible={showEditPool}
          onDismiss={() => setShowEditPool(false)}
          header="Edit user pool"
        >
          <Form
            actions={
              <>
                <Button variant="link" onClick={() => setShowEditPool(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={updateCognitoPool.isPending}
                  onClick={async () => {
                    await updateCognitoPool.mutateAsync({
                      name: editPoolName || undefined,
                      mfaConfiguration: editPoolMfa || undefined,
                    });
                    setShowEditPool(false);
                  }}
                >
                  Save
                </Button>
              </>
            }
          >
            <SpaceBetween size="s">
              <FormField label="Pool name">
                <Input value={editPoolName} onChange={({ detail }) => setEditPoolName(detail.value)} />
              </FormField>
              <FormField label="MFA configuration">
                <Select
                  selectedOption={editPoolMfa ? { label: editPoolMfa, value: editPoolMfa } : null}
                  onChange={({ detail }) => setEditPoolMfa(detail.selectedOption.value!)}
                  options={[
                    { label: "OFF", value: "OFF" },
                    { label: "ON", value: "ON" },
                    { label: "OPTIONAL", value: "OPTIONAL" },
                  ]}
                  placeholder="Select MFA configuration"
                  selectedAriaLabel="Selected MFA configuration"
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* G.86 — Pool Tags Modal */}
        <Modal
          visible={showPoolTags}
          onDismiss={() => setShowPoolTags(false)}
          header={`Tags for ${selectedPool}`}
        >
          <SpaceBetween size="s">
            {Object.keys(poolTagsData?.tags || {}).length === 0 ? (
              <Box color="text-body-secondary">No tags</Box>
            ) : (
              <SpaceBetween size="xs">
                {Object.entries(poolTagsData?.tags as Record<string, string>).map(([k, v]) => (
                  <SpaceBetween key={k} direction="horizontal" size="xs">
                    <Box variant="small"><b>{k}:</b> {v}</Box>
                    <Button
                      variant="link"
                      onClick={async () => {
                        await untagPool.mutateAsync({ tagKeys: [k] });
                      }}
                    >
                      Remove
                    </Button>
                  </SpaceBetween>
                ))}
              </SpaceBetween>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Input placeholder="Key" value={newTagKey} onChange={({ detail }) => setNewTagKey(detail.value)} />
              <Input placeholder="Value" value={newTagValue} onChange={({ detail }) => setNewTagValue(detail.value)} />
              <Button
                variant="primary"
                disabled={!newTagKey}
                loading={tagPool.isPending}
                onClick={async () => {
                  await tagPool.mutateAsync({ tags: { [newTagKey]: newTagValue } });
                  setNewTagKey("");
                  setNewTagValue("");
                }}
              >
                Add tag
              </Button>
            </SpaceBetween>
            <Button variant="link" onClick={() => setShowPoolTags(false)}>
              Close
            </Button>
          </SpaceBetween>
        </Modal>

      </>
    );
  }

  return (
    <>
    <ResourceTable
      resourceName="User Pool"
      headerTitle="Cognito User Pools"
      headerCounter={data?.total}
      items={(data?.userPools || []).map((p: any) => ({
        id: p.Id,
        name: p.Name,
        status: p.Status,
        created: p.CreationDate ? new Date(p.CreationDate * 1000).toLocaleDateString() : "-",
      }))}
      loading={isLoading}
      emptyMessage="No Cognito user pools"
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (i: any) => (
            <Button variant="link" onClick={() => setSelectedPool(i.id)}>
              {i.name}
            </Button>
          ),
          isRowHeader: true,
        },
        { id: "id", header: "Pool ID", cell: (i: any) => i.id },
        { id: "status", header: "Status", cell: (i: any) => i.status },
        { id: "created", header: "Created", cell: (i: any) => i.created },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              <DeleteButton
                itemName={i.name}
                resourceType="user pool"
                loading={deletePool.isPending && deletePool.variables === i.id}
                onDelete={() => deletePool.mutateAsync(i.id)}
              />
            </SpaceBetween>
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find user pools"
      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
    />
      </>
  );
}

// ────────────────────────────────────────────────────────
//  API Gateway V2
// ────────────────────────────────────────────────────────

