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
  >("initiate");
  const [authFlowAccessToken, setAuthFlowAccessToken] = useState("");
  const [authFlowSession, setAuthFlowSession] = useState("");
  const [authFlowChallengeName, setAuthFlowChallengeName] = useState("NEW_PASSWORD_REQUIRED");
  const [authFlowChallengeResponses, setAuthFlowChallengeResponses] = useState("");
  const [authFlowUserAttributes, setAuthFlowUserAttributes] = useState("");
  const [authFlowSecretHash, setAuthFlowSecretHash] = useState("");
  const [secretsClientId, setSecretsClientId] = useState<string | null>(null);
  const [newClientSecret, setNewClientSecret] = useState("");

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
          <Button iconName="arrow-left" onClick={() => setSelectedPool(null)}>
            Back to user pools
          </Button>
        </Box>
        <Tabs
          tabs={[
            {
              id: "users",
              label: "Users",
              content: (
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
                  ]}
                  filterEnabled
                  filterPlaceholder="Find users"
                  filterFunction={(i: any, s: string) => i.username.toLowerCase().includes(s.toLowerCase())}
                />
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
                        <Button
                          variant="link"
                          onClick={() => {
                            setSecretsClientId(i.id);
                            setNewClientSecret("");
                          }}
                        >
                          Manage Secrets
                        </Button>
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
                        activeAuthFlowType !== "delete-user-attributes" && (
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
                        activeAuthFlowType !== "delete-user-attributes" && (
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
                        activeAuthFlowType === "confirm-forgot-password") && (
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
                      {activeAuthFlowType === "admin-respond-challenge" && (
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
                        activeAuthFlowType === "delete-user-attributes") && (
                        <FormField label="Access Token">
                          <Input
                            value={authFlowAccessToken}
                            onChange={({ detail }) => setAuthFlowAccessToken(detail.value)}
                            placeholder="Access token from successful authentication"
                          />
                        </FormField>
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
                        activeAuthFlowType === "confirm-forgot-password") && (
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
                          deleteUserAttributes.isPending
                        }
                        disabled={(function () {
                          switch (activeAuthFlowType) {
                            case "initiate":
                            case "admin-initiate":
                              return !authFlowClientId || !authFlowUsername || !authFlowPassword;
                            case "confirm-sign-up":
                              return !authFlowClientId || !authFlowUsername || !authFlowConfirmationCode;
                            case "admin-respond-challenge":
                              return !authFlowClientId || !authFlowChallengeName;
                            case "forgot-password":
                              return !authFlowClientId || !authFlowUsername;
                            case "confirm-forgot-password":
                              return !authFlowClientId || !authFlowUsername || !authFlowConfirmationCode || !authFlowPassword;
                            case "get-user":
                            case "delete-user-attributes":
                              return !authFlowAccessToken;
                            case "update-user-attributes":
                              return !authFlowAccessToken || !authFlowUserAttributes;
                            default:
                              return true;
                          }
                        })()}
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
                            } else if (activeAuthFlowType === "delete-user-attributes") {
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
                        {(resourceServersData.resourceServers || []).map((rs: any) => (
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
      </>
    );
  }

  return (
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
            <DeleteButton
              itemName={i.name}
              resourceType="user pool"
              loading={deletePool.isPending && deletePool.variables === i.id}
              onDelete={() => deletePool.mutateAsync(i.id)}
            />
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find user pools"
      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
    />
  );
}

// ────────────────────────────────────────────────────────
//  API Gateway V2
// ────────────────────────────────────────────────────────

