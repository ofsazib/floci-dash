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

export function CodeDeployDashboard() {
  const applicationsQuery = useCodeDeployApplications();
  const createApplication = useCreateCodeDeployApplication();
  const deleteApplication = useDeleteCodeDeployApplication();
  const deploymentConfigsQuery = useCodeDeployDeploymentConfigs();
  const createDeploymentConfig = useCreateCodeDeployDeploymentConfig();
  const createDeploymentGroup = useCreateCodeDeployDeploymentGroup();
  const createDeployment = useCreateCodeDeployDeployment();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [appName, setAppName] = useState("");
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [configName, setConfigName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupRoleArn, setGroupRoleArn] = useState("");
  const [showCreateDeployment, setShowCreateDeployment] = useState(false);
  const [deployGroupName, setDeployGroupName] = useState("");
  const deploymentGroupsQuery = useCodeDeployDeploymentGroups(selectedApp);
  const deploymentsQuery = useCodeDeployDeployments(selectedApp);

  const apps = (applicationsQuery.data?.applications || []).map((a: any) => ({
    name: a.applicationName,
    description: a.description || "—",
    created: a.createTime ? new Date(a.createTime).toLocaleDateString() : "—",
  }));

  const groups = (deploymentGroupsQuery.data?.deploymentGroups || []).map((g: any) => ({
    name: g.deploymentGroupName,
    roleArn: g.serviceRoleArn || "—",
    config: g.deploymentConfigName || "—",
  }));

  const deploys = (deploymentsQuery.data?.deployments || []).map((d: any) => ({
    id: d.deploymentId,
    groupName: d.deploymentGroupName || "—",
    status: d.status || "—",
    created: d.createTime ? new Date(d.createTime).toLocaleDateString() : "—",
  }));

  const configs = (deploymentConfigsQuery.data?.deploymentConfigs || []).map((c: any) => ({
    name: typeof c === "string" ? c : c.deploymentConfigName || "—",
  }));

  if (applicationsQuery.isLoading) return <TableSkeleton />;

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "applications",
            label: `Applications (${applicationsQuery.data?.total || 0})`,
            content: (
              <>
                <ResourceTable
                  resourceName="Application"
                  headerTitle="CodeDeploy Applications"
                  headerCounter={applicationsQuery.data?.total}
                  items={apps}
                  columns={[
                    {
                      id: "name",
                      header: "Name",
                      cell: (i: any) => (
                        <Button variant="link" onClick={() => setSelectedApp(i.name === selectedApp ? null : i.name)}>
                          {i.name}
                        </Button>
                      ),
                      isRowHeader: true,
                    },
                    { id: "description", header: "Description", cell: (i: any) => i.description },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: any) => (
                        <DeleteButton
                          itemName={i.name}
                          resourceType="application"
                          loading={deleteApplication.isPending && deleteApplication.variables === i.name}
                          onDelete={() => deleteApplication.mutateAsync(i.name)}
                        />
                      ),
                    },
                  ]}
                  loading={applicationsQuery.isLoading}
                  emptyMessage="No applications found"
                  filterEnabled
                  filterPlaceholder="Find applications by name"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  onCreate={() => setShowCreateApp(true)}
                />

                {selectedApp && (
                  <Container
                    header={
                      <Header
                        variant="h3"
                        counter={deploymentGroupsQuery.data?.total}
                        actions={
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => setShowCreateGroup(true)}>Create group</Button>
                            <Button onClick={() => setShowCreateDeployment(true)}>Create deployment</Button>
                          </SpaceBetween>
                        }
                      >
                        Deployment Groups — {selectedApp}
                      </Header>
                    }
                  >
                    <ResourceTable
                      resourceName="Deployment Group"
                      items={groups}
                      columns={[
                        { id: "name", header: "Group Name", cell: (i: any) => i.name, isRowHeader: true },
                        { id: "role", header: "Service Role", cell: (i: any) => i.roleArn },
                        { id: "config", header: "Deployment Config", cell: (i: any) => i.config },
                      ]}
                      loading={deploymentGroupsQuery.isLoading}
                      emptyMessage="No deployment groups"
                      filterEnabled
                      filterPlaceholder="Find groups"
                      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                    />
                  </Container>
                )}

                {selectedApp && (
                  <Container
                    header={
                      <Header variant="h3" counter={deploymentsQuery.data?.total}>
                        Deployments — {selectedApp}
                      </Header>
                    }
                  >
                    <ResourceTable
                      resourceName="Deployment"
                      items={deploys}
                      columns={[
                        { id: "id", header: "Deployment ID", cell: (i: any) => i.id, isRowHeader: true },
                        { id: "group", header: "Group", cell: (i: any) => i.groupName },
                        { id: "status", header: "Status", cell: (i: any) => i.status },
                        { id: "created", header: "Created", cell: (i: any) => i.created },
                      ]}
                      loading={deploymentsQuery.isLoading}
                      emptyMessage="No deployments"
                      filterEnabled
                      filterPlaceholder="Find deployments by ID"
                      filterFunction={(i: any, s: string) => (i.id || "").toLowerCase().includes(s.toLowerCase())}
                    />
                  </Container>
                )}

                <Modal
                  visible={showCreateApp}
                  onDismiss={() => setShowCreateApp(false)}
                  header="Create application"
                  footer={
                    <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setShowCreateApp(false)}>Cancel</Button>
                        <Button
                          variant="primary"
                          loading={createApplication.isPending}
                          disabled={!appName.trim()}
                          onClick={() => {
                            createApplication.mutate(
                              { applicationName: appName.trim() },
                              { onSuccess: () => { setShowCreateApp(false); setAppName(""); } }
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
                    {createApplication.isError && (
                      <Alert type="error" dismissible>
                        {(createApplication.error as Error)?.message || "Failed to create application"}
                      </Alert>
                    )}
                    <FormField label="Application name" description="A name for your CodeDeploy application.">
                      <Input value={appName} onChange={({ detail }) => setAppName(detail.value)} placeholder="my-app" />
                    </FormField>
                  </Form>
                </Modal>

                {selectedApp && (
                  <Modal
                    visible={showCreateGroup}
                    onDismiss={() => setShowCreateGroup(false)}
                    header="Create deployment group"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createDeploymentGroup.isPending}
                            disabled={!groupName.trim() || !groupRoleArn.trim()}
                            onClick={() => {
                              createDeploymentGroup.mutate(
                                {
                                  appName: selectedApp,
                                  deploymentGroupName: groupName.trim(),
                                  serviceRoleArn: groupRoleArn.trim(),
                                },
                                { onSuccess: () => { setShowCreateGroup(false); setGroupName(""); setGroupRoleArn(""); } }
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
                      {createDeploymentGroup.isError && (
                        <Alert type="error" dismissible>
                          {(createDeploymentGroup.error as Error)?.message || "Failed to create group"}
                        </Alert>
                      )}
                      <SpaceBetween size="m">
                        <FormField label="Deployment group name">
                          <Input value={groupName} onChange={({ detail }) => setGroupName(detail.value)} placeholder="my-group" />
                        </FormField>
                        <FormField label="Service role ARN">
                          <Input value={groupRoleArn} onChange={({ detail }) => setGroupRoleArn(detail.value)} placeholder="arn:aws:iam::123:role/MyRole" />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                )}

                {selectedApp && (
                  <Modal
                    visible={showCreateDeployment}
                    onDismiss={() => setShowCreateDeployment(false)}
                    header="Create deployment"
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateDeployment(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createDeployment.isPending}
                            disabled={!deployGroupName.trim()}
                            onClick={() => {
                              createDeployment.mutate(
                                {
                                  appName: selectedApp,
                                  deploymentGroupName: deployGroupName.trim(),
                                },
                                { onSuccess: () => { setShowCreateDeployment(false); setDeployGroupName(""); } }
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
                      {createDeployment.isError && (
                        <Alert type="error" dismissible>
                          {(createDeployment.error as Error)?.message || "Failed to create deployment"}
                        </Alert>
                      )}
                      <FormField label="Deployment group name">
                        <Input value={deployGroupName} onChange={({ detail }) => setDeployGroupName(detail.value)} placeholder="my-group" />
                      </FormField>
                    </Form>
                  </Modal>
                )}
              </>
            ),
          },
          {
            id: "deployment-configs",
            label: `Deployment Configs (${deploymentConfigsQuery.data?.total || 0})`,
            content: (
              <>
                <ResourceTable
                  resourceName="Deployment Config"
                  headerTitle="Deployment Configs"
                  headerCounter={deploymentConfigsQuery.data?.total}
                  items={configs}
                  columns={[
                    { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                  ]}
                  loading={deploymentConfigsQuery.isLoading}
                  emptyMessage="No deployment configs"
                  filterEnabled
                  filterPlaceholder="Find configs by name"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  onCreate={() => setShowCreateConfig(true)}
                />
                <Modal
                  visible={showCreateConfig}
                  onDismiss={() => setShowCreateConfig(false)}
                  header="Create deployment config"
                  footer={
                    <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setShowCreateConfig(false)}>Cancel</Button>
                        <Button
                          variant="primary"
                          loading={createDeploymentConfig.isPending}
                          disabled={!configName.trim()}
                          onClick={() => {
                            createDeploymentConfig.mutate(
                              { deploymentConfigName: configName.trim() },
                              { onSuccess: () => { setShowCreateConfig(false); setConfigName(""); } }
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
                    {createDeploymentConfig.isError && (
                      <Alert type="error" dismissible>
                        {(createDeploymentConfig.error as Error)?.message || "Failed to create config"}
                      </Alert>
                    )}
                    <FormField label="Deployment config name">
                      <Input value={configName} onChange={({ detail }) => setConfigName(detail.value)} placeholder="MyConfig" />
                    </FormField>
                  </Form>
                </Modal>
              </>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}

