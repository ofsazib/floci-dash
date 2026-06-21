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

export function ECSDashboard() {
  const { data, isLoading, isError, error } = useECSClusters();
  const createCluster = useCreateECSCluster();
  const deleteCluster = useDeleteECSCluster();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [clusterName, setClusterName] = useState("");

  const clusters = data?.clusters || [];

  const clusterColumns = [
    { id: "name", header: "Cluster Name", cell: (item: any) => item.clusterName || "—", isRowHeader: true },
    { id: "status", header: "Status", cell: (item: any) => <StatusBadge status={item.status || "ACTIVE"} /> },
    { id: "runningTasks", header: "Running Tasks", cell: (item: any) => item.runningTasksCount ?? 0 },
    { id: "services", header: "Services", cell: (item: any) => item.activeServicesCount ?? 0 },
    { id: "instances", header: "Container Instances", cell: (item: any) => item.registeredContainerInstancesCount ?? 0 },
    {
      id: "actions",
      header: "",
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setSelectedCluster(item.clusterName)}>
            View
          </Button>
          <DeleteButton
            itemName={item.clusterName}
            resourceType="cluster"
            loading={deleteCluster.isPending}
            onDelete={() => deleteCluster.mutateAsync(item.clusterArn)}
          />
        </SpaceBetween>
      ),
    },
  ];

  if (selectedCluster) {
    return <ECSClusterDetail clusterName={selectedCluster} onBack={() => setSelectedCluster(null)} />;
  }

  return (
    <>
      <ResourceTable
        resourceName="Cluster"
        headerTitle="ECS Clusters"
        headerCounter={data?.total}
        items={clusters}
        columns={clusterColumns}
        loading={isLoading}
        emptyMessage="No clusters found. Create one to get started."
        filterEnabled
        filterPlaceholder="Find clusters by name"
        filterFunction={(item: any, searchText: string) =>
          (item.clusterName || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create cluster"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={createCluster.isPending}
                disabled={!clusterName.trim()}
                onClick={() => {
                  createCluster.mutate(
                    { clusterName: clusterName.trim() },
                    { onSuccess: () => { setShowCreate(false); setClusterName(""); } }
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
          {createCluster.isError && (
            <Alert type="error" dismissible>
              {(createCluster.error as Error)?.message || "Failed to create cluster"}
            </Alert>
          )}
          <FormField label="Cluster name" description="Enter a name for your ECS cluster.">
            <Input
              value={clusterName}
              onChange={({ detail }) => setClusterName(detail.value)}
              placeholder="my-cluster"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}


function ECSClusterDetail({ clusterName, onBack }: { clusterName: string; onBack: () => void }) {
  const servicesQuery = useECSServices(clusterName);
  const tasksQuery = useECSTasks(clusterName);
  const taskDefsQuery = useECSTaskDefinitions();
  const taskDefFamilies = useECSTaskDefinitionFamilies();
  const createService = useCreateECSService();
  const deleteService = useDeleteECSService();
  const stopTask = useStopECSTask();
  const runTask = useRunECSTask();
  const [showRunTask, setShowRunTask] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);
  const [taskDefInput, setTaskDefInput] = useState("");
  const { showToast } = useToast();

  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    taskDefinition: "",
    desiredCount: 1,
    launchType: "FARGATE",
  });

  const tabs: TabsProps.Tab[] = [
    {
      label: `Services (${servicesQuery.data?.total || 0})`,
      id: "services",
      content: (
        <>
          <ResourceTable
            resourceName="Service"
            headerTitle="Services"
            headerCounter={servicesQuery.data?.total}
            items={servicesQuery.data?.services || []}
            columns={[
              { id: "name", header: "Service Name", cell: (item: any) => item.serviceName, isRowHeader: true },
              { id: "status", header: "Status", cell: (item: any) => <StatusBadge status={item.status || "ACTIVE"} /> },
              { id: "desired", header: "Desired", cell: (item: any) => item.desiredCount ?? 0 },
              { id: "running", header: "Running", cell: (item: any) => item.runningCount ?? 0 },
              { id: "taskDef", header: "Task Definition", cell: (item: any) => item.taskDefinition?.split("/").pop() || "—" },
              {
                id: "actions",
                header: "",
                cell: (item: any) => (
                  <DeleteButton
                    itemName={item.serviceName}
                    resourceType="service"
                    loading={deleteService.isPending}
                    onDelete={() =>
                      deleteService.mutateAsync({
                        cluster: clusterName,
                        service: item.serviceName,
                        force: true,
                      })
                    }
                  />
                ),
              },
            ]}
            loading={servicesQuery.isLoading}
            emptyMessage="No services in this cluster."
            filterEnabled
            filterPlaceholder="Find services"
            filterFunction={(item: any, s: string) => (item.serviceName || "").toLowerCase().includes(s.toLowerCase())}
            onCreate={() => setShowCreateService(true)}
          />
          <Modal
            visible={showCreateService}
            onDismiss={() => { setShowCreateService(false); setServiceForm({ serviceName: "", taskDefinition: "", desiredCount: 1, launchType: "FARGATE" }); }}
            header="Create Service"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowCreateService(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    loading={createService.isPending}
                    disabled={!serviceForm.serviceName.trim() || !serviceForm.taskDefinition.trim()}
                    onClick={() => {
                      createService.mutate(
                        {
                          cluster: clusterName,
                          serviceName: serviceForm.serviceName.trim(),
                          taskDefinition: serviceForm.taskDefinition.trim(),
                          desiredCount: serviceForm.desiredCount,
                          launchType: serviceForm.launchType,
                        },
                        {
                          onSuccess: () => {
                            setShowCreateService(false);
                            setServiceForm({ serviceName: "", taskDefinition: "", desiredCount: 1, launchType: "FARGATE" });
                            showToast("success", `Service "${serviceForm.serviceName}" created`);
                          },
                          onError: (err) => showToast("error", (err as Error)?.message || "Failed to create service"),
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
              {createService.isError && (
                <Alert type="error" dismissible>
                  {(createService.error as Error)?.message || "Failed to create service"}
                </Alert>
              )}
              <SpaceBetween size="m">
                <FormField label="Service name" description="A unique name within the cluster.">
                  <Input
                    value={serviceForm.serviceName}
                    onChange={({ detail }) => setServiceForm((p) => ({ ...p, serviceName: detail.value }))}
                    placeholder="my-service"
                  />
                </FormField>
                <FormField
                  label="Task definition"
                  description="Select a task definition family (uses latest revision)."
                >
                  <Select
                    selectedOption={
                      serviceForm.taskDefinition
                        ? { label: serviceForm.taskDefinition, value: serviceForm.taskDefinition }
                        : { label: "Select task definition", value: "" }
                    }
                    onChange={({ detail }) =>
                      setServiceForm((p) => ({
                        ...p,
                        taskDefinition: detail.selectedOption?.value || "",
                      }))
                    }
                    options={(taskDefFamilies.data?.families || []).map((f: string) => ({ label: f, value: f }))}
                    placeholder="Select task definition"
                    filteringType="auto"
                  />
                </FormField>
                <FormField label="Desired count" description="Number of tasks to run.">
                  <Input
                    type="number"
                    value={String(serviceForm.desiredCount)}
                    onChange={({ detail }) =>
                      setServiceForm((p) => ({ ...p, desiredCount: Math.max(0, Number(detail.value) || 0) }))
                    }
                  />
                </FormField>
                <FormField label="Launch type">
                  <Select
                    selectedOption={{ label: serviceForm.launchType, value: serviceForm.launchType }}
                    onChange={({ detail }) =>
                      setServiceForm((p) => ({ ...p, launchType: detail.selectedOption?.value || "FARGATE" }))
                    }
                    options={[
                      { label: "FARGATE", value: "FARGATE" },
                      { label: "EC2", value: "EC2" },
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
      label: `Tasks (${tasksQuery.data?.total || 0})`,
      id: "tasks",
      content: (
        <>
          <ResourceTable
            resourceName="Task"
            headerTitle="Tasks"
            headerCounter={tasksQuery.data?.total}
            items={tasksQuery.data?.tasks || []}
            columns={[
              { id: "arn", header: "Task ARN", cell: (item: any) => item.taskArn?.split("/").pop() || "—", isRowHeader: true },
              { id: "status", header: "Last Status", cell: (item: any) => <StatusBadge status={item.lastStatus || "UNKNOWN"} /> },
              { id: "desired", header: "Desired", cell: (item: any) => item.desiredStatus || "—" },
              { id: "taskDef", header: "Task Definition", cell: (item: any) => item.taskDefinitionArn?.split("/").pop() || "—" },
              { id: "group", header: "Group", cell: (item: any) => item.group || "—" },
              {
                id: "actions",
                header: "",
                cell: (item: any) =>
                  item.lastStatus !== "STOPPED" ? (
                    <Button
                      variant="link"
                      onClick={() =>
                        stopTask.mutateAsync({
                          cluster: clusterName,
                          task: item.taskArn,
                          reason: "Stopped via dashboard",
                        })
                      }
                    >
                      Stop
                    </Button>
                  ) : null,
              },
            ]}
            loading={tasksQuery.isLoading}
            emptyMessage="No running tasks in this cluster."
            onCreate={() => setShowRunTask(true)}
          />
          <Modal
            visible={showRunTask}
            onDismiss={() => setShowRunTask(false)}
            header="Run task"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="link" onClick={() => setShowRunTask(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    loading={runTask.isPending}
                    disabled={!taskDefInput.trim()}
                    onClick={() => {
                      runTask.mutate(
                        { cluster: clusterName, taskDefinition: taskDefInput.trim(), count: 1 },
                        { onSuccess: () => { setShowRunTask(false); setTaskDefInput(""); } }
                      );
                    }}
                  >
                    Run
                  </Button>
                </SpaceBetween>
              </Box>
            }
          >
            <Form>
              {runTask.isError && (
                <Alert type="error" dismissible>
                  {(runTask.error as Error)?.message || "Failed to run task"}
                </Alert>
              )}
              <FormField label="Task definition" description="Family:revision or full ARN">
                <Input
                  value={taskDefInput}
                  onChange={({ detail }) => setTaskDefInput(detail.value)}
                  placeholder="my-task:1"
                />
              </FormField>
            </Form>
          </Modal>
        </>
      ),
    },
    {
      label: `Task Definitions (${taskDefsQuery.data?.total || 0})`,
      id: "task-defs",
      content: (
        <ResourceTable
          resourceName="Task Definition"
          headerTitle="Task Definitions"
          headerCounter={taskDefsQuery.data?.total}
          items={(taskDefsQuery.data?.taskDefinitionArns || []).map((arn: string) => ({ arn }))}
          columns={[
            { id: "arn", header: "Task Definition ARN", cell: (item: any) => item.arn.split("/").pop() || item.arn, isRowHeader: true },
          ]}
          loading={taskDefsQuery.isLoading}
          emptyMessage="No task definitions registered."
          filterEnabled
          filterPlaceholder="Find task definitions"
          filterFunction={(item: any, s: string) => (item.arn || "").toLowerCase().includes(s.toLowerCase())}
        />
      ),
    },
  ];

  return (
    <SpaceBetween size="l">
      <Button variant="link" onClick={onBack}>
        &larr; Clusters
      </Button>
      <Box variant="h2">{clusterName}</Box>
      <Tabs tabs={tabs} />
    </SpaceBetween>
  );
}

// ────────────────────────────────────────────────────────
//  API Gateway
// ────────────────────────────────────────────────────────

