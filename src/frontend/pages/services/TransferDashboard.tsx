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
  useUpdateTransferServer,
  useUpdateTransferUser,
  useImportTransferSshKey,
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

export function TransferDashboard() {
  const { data: serversData, isLoading: serversLoading } = useTransferServers();
  const createServer = useCreateTransferServer();
  const deleteServer = useDeleteTransferServer();
  const startServer = useStartTransferServer();
  const stopServer = useStopTransferServer();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const { data: usersData } = useTransferUsers(selectedServerId);
  const createUser = useCreateTransferUser();
  const deleteUser = useDeleteTransferUser();
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const updateServer = useUpdateTransferServer();
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [editPolicy, setEditPolicy] = useState("");
  const updateServerUser = useUpdateTransferUser();
  const importSshKey = useImportTransferSshKey();
  const [sshUser, setSshUser] = useState<string | null>(null);
  const [sshBody, setSshBody] = useState("");
  const [serverDomain, setServerDomain] = useState<SelectProps.Option>({ label: "S3", value: "S3" });
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  const servers = (serversData?.servers || []).map((s: any) => ({
    serverId: s.ServerId,
    arn: s.Arn || "-",
    domain: s.Domain || "-",
    state: s.State || s._state || "-",
    protocol: s.Protocols ? s.Protocols.join(", ") : s.EndpointType || "-",
    identityProvider: s.IdentityProviderType || "SERVICE_MANAGED",
    created: s.CreatedDate ? new Date(s.CreatedDate).toLocaleDateString() : "-",
  }));

  const users = (usersData?.users || []).map((u: any) => ({
    userName: u.UserName,
    role: u.Role || "-",
    homeDirectory: u.HomeDirectory || "-",
    sshKeys: u.SshPublicKeyCount ?? u.SshPublicKeys?.length ?? "-",
  }));

  if (serversLoading) return <TableSkeleton />;

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Server"
        headerTitle="Transfer Servers"
        headerCounter={serversData?.total}
        items={servers}
        columns={[
          {
            id: "serverId",
            header: "Server ID",
            cell: (i: any) => (
              <Button variant="link" onClick={() => setSelectedServerId(i.serverId === selectedServerId ? null : i.serverId)}>
                {i.serverId}
              </Button>
            ),
            isRowHeader: true,
          },
          { id: "domain", header: "Domain", cell: (i: any) => i.domain },
          { id: "state", header: "State", cell: (i: any) => i.state },
          { id: "protocol", header: "Protocol", cell: (i: any) => i.protocol },
          { id: "identityProvider", header: "Identity Provider", cell: (i: any) => i.identityProvider },
          { id: "created", header: "Created", cell: (i: any) => i.created },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                {i.state !== "ONLINE" && (
                  <Button
                    loading={startServer.isPending && startServer.variables === i.serverId}
                    onClick={() => startServer.mutate(i.serverId)}
                  >
                    Start
                  </Button>
                )}
                {i.state === "ONLINE" && (
                  <Button
                    loading={stopServer.isPending && stopServer.variables === i.serverId}
                    onClick={() => stopServer.mutate(i.serverId)}
                  >
                    Stop
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setEditServerId(i.serverId === editServerId ? null : i.serverId);
                    setEditPolicy("");
                  }}
                >
                  Edit
                </Button>
                <DeleteButton
                  itemName={i.serverId}
                  resourceType="server"
                  loading={deleteServer.isPending && deleteServer.variables === i.serverId}
                  onDelete={() => deleteServer.mutateAsync(i.serverId)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        loading={serversLoading}
        emptyMessage="No transfer servers"
        filterEnabled
        filterPlaceholder="Find servers by ID"
        filterFunction={(i: any, s: string) => i.serverId.toLowerCase().includes(s.toLowerCase())}
        onCreate={() => setShowCreateServer(true)}
      />

      {selectedServerId && (
        <Container header={<Header variant="h3" counter={usersData?.total} actions={<Button onClick={() => setShowCreateUser(true)}>Create user</Button>}>Users for {selectedServerId}</Header>}>
          <ResourceTable
            resourceName="User"
            items={users}
            columns={[
              { id: "userName", header: "Username", cell: (i: any) => i.userName, isRowHeader: true },
              { id: "role", header: "Role", cell: (i: any) => i.role },
              { id: "homeDirectory", header: "Home Directory", cell: (i: any) => i.homeDirectory },
              { id: "sshKeys", header: "SSH Keys", cell: (i: any) => i.sshKeys },
              {
                id: "sshKeys",
                header: "",
                cell: (i: any) => (
                  <Button onClick={() => { setSshUser(i.userName === sshUser ? null : i.userName); setSshBody(""); }}>
                    {i.userName === sshUser ? "Hide key form" : "Add SSH key"}
                  </Button>
                ),
              },
              {
                id: "actions",
                header: "",
                cell: (i: any) => (
                  <DeleteButton
                    itemName={i.userName}
                    resourceType="user"
                    loading={deleteUser.isPending && (deleteUser.variables as any)?.userName === i.userName}
                    onDelete={() => deleteUser.mutateAsync({ serverId: selectedServerId, userName: i.userName })}
                  />
                ),
              },
            ]}
            emptyMessage="No users for this server"
          />
          {sshUser && (
            <Container header={<Header variant="h3">Import SSH key for {sshUser}</Header>}>
              <SpaceBetween size="s">
                <Textarea
                  value={sshBody}
                  onChange={({ detail }) => setSshBody(detail.value)}
                  rows={3}
                  placeholder="ssh-ed25519 AAAA..."
                />
                <Button
                  variant="primary"
                  disabled={!sshBody.trim()}
                  loading={importSshKey.isPending}
                  onClick={() =>
                    importSshKey.mutate(
                      { serverId: selectedServerId!, userName: sshUser, sshPublicKeyBody: sshBody.trim() },
                      { onSuccess: () => { setSshUser(null); setSshBody(""); } }
                    )
                  }
                >
                  Import key
                </Button>
                {importSshKey.isError && (
                  <Alert type="error" dismissible>
                    {(importSshKey.error as Error)?.message || "Failed to import SSH key"}
                  </Alert>
                )}
              </SpaceBetween>
            </Container>
          )}
        </Container>
      )}

      {showCreateServer && (
      <Modal
        visible={showCreateServer}
        onDismiss={() => setShowCreateServer(false)}
        header="Create transfer server"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateServer(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createServer.isPending}
                onClick={() => {
                  createServer.mutate(
                    // Select options always carry a value, so no "S3" fallback needed.
                    { domain: serverDomain.value as string },
                    { onSuccess: () => setShowCreateServer(false) }
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
          {createServer.isError && (
            <Alert type="error" dismissible>
              {(createServer.error as Error)?.message || "Failed to create server"}
            </Alert>
          )}
          <FormField label="Domain">
            <Select
              selectedOption={serverDomain}
              onChange={({ detail }) => setServerDomain(detail.selectedOption)}
              options={[
                { label: "S3", value: "S3" },
                { label: "EFS", value: "EFS" },
              ]}
            />
          </FormField>
        </Form>
      </Modal>
      )}

      {showCreateUser && (
      <Modal
        visible={showCreateUser}
        onDismiss={() => setShowCreateUser(false)}
        header="Create transfer user"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateUser(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createUser.isPending}
                disabled={!userName.trim() || !userRole.trim()}
                onClick={() => {
                  // "Create user" is only reachable with a selected server, so no guard needed.
                  createUser.mutate(
                    { serverId: selectedServerId!, userName: userName.trim(), role: userRole.trim() },
                    { onSuccess: () => { setShowCreateUser(false); setUserName(""); setUserRole(""); } }
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
          {createUser.isError && (
            <Alert type="error" dismissible>
              {(createUser.error as Error)?.message || "Failed to create user"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Username">
              <Input value={userName} onChange={({ detail }) => setUserName(detail.value)} placeholder="my-user" />
            </FormField>
            <FormField label="IAM Role ARN">
              <Input value={userRole} onChange={({ detail }) => setUserRole(detail.value)} placeholder="arn:aws:iam::..." />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
      )}
          {editServerId && (
        <Modal
          visible
          onDismiss={() => setEditServerId(null)}
          header={`Edit server — ${editServerId}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setEditServerId(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={updateServer.isPending}
                  onClick={() => {
                    updateServer.mutate(
                      {
                        serverId: editServerId,
                        securityPolicyName: editPolicy.trim() || undefined,
                      },
                      { onSuccess: () => setEditServerId(null) }
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
            {updateServer.isError && (
              <Alert type="error" dismissible>
                {(updateServer.error as Error)?.message || "Failed to update server"}
              </Alert>
            )}
            <FormField label="Security policy name">
              <Input value={editPolicy} onChange={({ detail }) => setEditPolicy(detail.value)} placeholder="TransferSecurityPolicy-2024-03" />
            </FormField>
          </Form>
        </Modal>
      )}
    </SpaceBetween>
  );
}
