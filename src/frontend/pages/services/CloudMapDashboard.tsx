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
  useCloudMapOperations,
  useCloudMapOperation,
  useCloudMapInstance,
  useCreateCloudMapPrivateDnsNamespace,
  useCreateCloudMapPublicDnsNamespace,
  useCreateCloudMapNamespace,
  useDeleteCloudMapNamespace,
  useCloudMapServices,
  useDeleteCloudMapService,
  useCloudMapInstances,
  useRegisterCloudMapInstance,
  useDeregisterCloudMapInstance,
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

export function CloudMapDashboard() {
  const { data: nsData, isLoading } = useCloudMapNamespaces();
  const deleteNs = useDeleteCloudMapNamespace();
  const createHttpNs = useCreateCloudMapNamespace();
  const createPrivateDns = useCreateCloudMapPrivateDnsNamespace();
  const createPublicDns = useCreateCloudMapPublicDnsNamespace();
  const { data: opsData } = useCloudMapOperations();
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const { data: opDetail } = useCloudMapOperation(selectedOp);
  const [detailInstance, setDetailInstance] = useState<string | null>(null);
  const [showCreateNs, setShowCreateNs] = useState(false);
  const [nsType, setNsType] = useState("HTTP");
  const [nsName, setNsName] = useState("");
  const [nsVpc, setNsVpc] = useState("");
  const [nsDesc, setNsDesc] = useState("");
  const [selectedNs, setSelectedNs] = useState<string | null>(null);
  const { data: svcData } = useCloudMapServices(selectedNs);
  const deleteSvc = useDeleteCloudMapService();
  const [selectedSvc, setSelectedSvc] = useState<string | null>(null);
  const { data: instDetail } = useCloudMapInstance(selectedSvc, detailInstance);
  const { data: instData } = useCloudMapInstances(selectedSvc);
  const registerInstance = useRegisterCloudMapInstance();
  const deregisterInstance = useDeregisterCloudMapInstance();
  const [showRegister, setShowRegister] = useState(false);
  const [newInstanceId, setNewInstanceId] = useState("");
  const [newInstanceIp, setNewInstanceIp] = useState("");

  if (isLoading) return <TableSkeleton />;

  if (selectedNs && selectedSvc) {
    return (
      <>
        <Box margin={{ bottom: "s" }}>
          <Button
            iconName="arrow-left"
            onClick={() => setSelectedSvc(null)}
          >
            Back to services
          </Button>
        </Box>
        <ResourceTable
          resourceName="Instance"
          headerTitle={`Instances in ${selectedSvc}`}
          headerCounter={instData?.total}
          items={(instData?.instances || []).map((i: any) => ({
            id: i.Id,
            attributes: Object.entries(i.Attributes || {}).map(([k, v]) => `${k}=${v}`).join(", "),
          }))}
          loading={false}
          emptyMessage="No instances"
          columns={[
            {
              id: "id",
              header: "Instance ID",
              cell: (i: any) => (
                <Button variant="link" onClick={() => setDetailInstance(i.id === detailInstance ? null : i.id)}>
                  {i.id}
                </Button>
              ),
              isRowHeader: true,
            },
            { id: "attributes", header: "Attributes", cell: (i: any) => i.attributes },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => setDetailInstance(i.id === detailInstance ? null : i.id)}
                  >
                    {i.id === detailInstance ? "Hide detail" : "Detail"}
                  </Button>
                  <DeleteButton
                    itemName={i.id}
                    resourceType="instance registration"
                  loading={deregisterInstance.isPending}
                  onDelete={() =>
                    deregisterInstance.mutateAsync({ serviceId: selectedSvc, instanceId: i.id })
                  }
                />
                </SpaceBetween>
              ),
            },
          ]}
          onCreate={() => setShowRegister(true)}
        />

        {detailInstance && instDetail?.instance && (
          <Container header={<Header variant="h3">Instance — {detailInstance}</Header>}>
            <ColumnLayout columns={2} variant="text-grid">
              <div><b>Instance ID:</b> {instDetail.instance.id}</div>
              <div>
                <b>Attributes:</b>{" "}
                {Object.entries(instDetail.instance.attributes || {}).map(([k, v]) => `${k}=${v}`).join(", ") || "-"}
              </div>
            </ColumnLayout>
          </Container>
        )}

        <Modal
          visible={showRegister}
          onDismiss={() => setShowRegister(false)}
          header="Register instance"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowRegister(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={registerInstance.isPending}
                  disabled={!newInstanceId.trim()}
                  onClick={() => {
                    registerInstance.mutate(
                      {
                        serviceId: selectedSvc,
                        instanceId: newInstanceId.trim(),
                        attributes: newInstanceIp.trim()
                          ? { AWS_INSTANCE_IPV4: newInstanceIp.trim() }
                          : undefined,
                      },
                      {
                        onSuccess: () => {
                          setShowRegister(false);
                          setNewInstanceId("");
                          setNewInstanceIp("");
                        },
                      }
                    );
                  }}
                >
                  Register
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            {registerInstance.isError && (
              <Alert type="error" dismissible>
                {(registerInstance.error as Error)?.message || "Failed to register instance"}
              </Alert>
            )}
            <SpaceBetween size="m">
              <FormField label="Instance ID">
                <Input value={newInstanceId} onChange={({ detail }) => setNewInstanceId(detail.value)} placeholder="i-1" />
              </FormField>
              <FormField label="IPv4 address (optional)">
                <Input value={newInstanceIp} onChange={({ detail }) => setNewInstanceIp(detail.value)} placeholder="10.0.0.1" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </>
    );
  }

  if (selectedNs) {
    return (
      <>
        <Box margin={{ bottom: "s" }}>
          <Button iconName="arrow-left" onClick={() => setSelectedNs(null)}>
            Back to namespaces
          </Button>
        </Box>
        <ResourceTable
          resourceName="Service"
          headerTitle={`Services in namespace`}
          headerCounter={svcData?.total}
          items={(svcData?.services || []).map((s: any) => ({
            id: s.Id,
            name: s.Name,
            type: s.Type || "-",
            description: s.Description || "-",
          }))}
          loading={false}
          emptyMessage="No services"
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (i: any) => (
                <Button variant="link" onClick={() => setSelectedSvc(i.id)}>
                  {i.name}
                </Button>
              ),
              isRowHeader: true,
            },
            { id: "type", header: "Type", cell: (i: any) => i.type },
            { id: "description", header: "Description", cell: (i: any) => i.description },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <DeleteButton
                  itemName={i.name}
                  resourceType="service"
                  loading={deleteSvc.isPending && deleteSvc.variables === i.id}
                  onDelete={() => deleteSvc.mutateAsync(i.id)}
                />
              ),
            },
          ]}
          filterEnabled
          filterPlaceholder="Find services"
          filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
        />
      </>
    );
  }

  return (
    <>
    <ResourceTable
      resourceName="Namespace"
      headerTitle="Cloud Map Namespaces"
      headerCounter={nsData?.total}
      items={(nsData?.namespaces || []).map((n: any) => ({
        id: n.Id,
        name: n.Name,
        type: n.Type || "-",
        description: n.Description || "-",
      }))}
      loading={isLoading}
      emptyMessage="No namespaces"
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (i: any) => (
            <Button variant="link" onClick={() => setSelectedNs(i.id)}>
              {i.name}
            </Button>
          ),
          isRowHeader: true,
        },
        { id: "type", header: "Type", cell: (i: any) => i.type },
        { id: "description", header: "Description", cell: (i: any) => i.description },
        {
          id: "actions",
          header: "",
          cell: (i: any) => (
            <DeleteButton
              itemName={i.name}
              resourceType="namespace"
              loading={deleteNs.isPending && deleteNs.variables === i.id}
              onDelete={() => deleteNs.mutateAsync(i.id)}
            />
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find namespaces"
      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
      onCreate={() => setShowCreateNs(true)}
    />

    <ResourceTable
      resourceName="Operation"
      headerTitle="Operations"
      headerCounter={opsData?.total}
      items={(opsData?.operations || []).map((op) => ({
        id: op.id,
        status: op.status,
      }))}
      loading={false}
      emptyMessage="No operations"
      columns={[
        {
          id: "id",
          header: "Operation ID",
          cell: (i: any) => (
            <Button variant="link" onClick={() => setSelectedOp(i.id === selectedOp ? null : i.id)}>
              {i.id}
            </Button>
          ),
          isRowHeader: true,
        },
        { id: "status", header: "Status", cell: (i: any) => <StatusBadge status={i.status} /> },
      ]}
    />

    {selectedOp && opDetail?.operation && (
      <Container header={<Header variant="h3">Operation — {selectedOp}</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <div><b>Status:</b> {opDetail.operation.status}</div>
          <div><b>Created:</b> {opDetail.operation.createDate ? new Date(opDetail.operation.createDate).toLocaleString() : "-"}</div>
          <div><b>Updated:</b> {opDetail.operation.updateDate ? new Date(opDetail.operation.updateDate).toLocaleString() : "-"}</div>
          <div><b>Targets:</b> {Object.entries(opDetail.operation.targets || {}).map(([k, v]) => `${k}=${v}`).join(", ") || "-"}</div>
        </ColumnLayout>
      </Container>
    )}

    <Modal
      visible={showCreateNs}
      onDismiss={() => setShowCreateNs(false)}
      header="Create namespace"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setShowCreateNs(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={createPrivateDns.isPending || createPublicDns.isPending}
              disabled={!nsName.trim() || (nsType === "DNS_PRIVATE" && !nsVpc.trim())}
              onClick={() => {
                const opts = {
                  onSuccess: () => {
                    setShowCreateNs(false);
                    setNsName(""); setNsVpc(""); setNsDesc("");
                  },
                };
                if (nsType === "DNS_PRIVATE") {
                  createPrivateDns.mutate({ name: nsName.trim(), vpc: nsVpc.trim(), description: nsDesc.trim() || undefined }, opts);
                } else if (nsType === "DNS_PUBLIC") {
                  createPublicDns.mutate({ name: nsName.trim(), description: nsDesc.trim() || undefined }, opts);
                } else {
                  createHttpNs.mutate({ name: nsName.trim(), description: nsDesc.trim() || undefined }, opts);
                }
              }}
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        {(createHttpNs.isError || createPrivateDns.isError || createPublicDns.isError) && (
          <Alert type="error" dismissible>
            {(createHttpNs.error as Error)?.message ||
              (createPrivateDns.error as Error)?.message ||
              (createPublicDns.error as Error)?.message ||
              "Failed to create namespace"}
          </Alert>
        )}
        <SpaceBetween size="m">
          <FormField label="Type">
            <Select
              selectedOption={{ label: nsType === "DNS_PRIVATE" ? "Private DNS" : nsType === "DNS_PUBLIC" ? "Public DNS" : "HTTP", value: nsType }}
              onChange={({ detail }) => setNsType(detail.selectedOption.value as string)}
              options={[
                { label: "HTTP", value: "HTTP" },
                { label: "Private DNS", value: "DNS_PRIVATE" },
                { label: "Public DNS", value: "DNS_PUBLIC" },
              ]}
            />
          </FormField>
          <FormField label="Name">
            <Input value={nsName} onChange={({ detail }) => setNsName(detail.value)} placeholder="example.com" />
          </FormField>
          {nsType === "DNS_PRIVATE" && (
            <FormField label="VPC ID">
              <Input value={nsVpc} onChange={({ detail }) => setNsVpc(detail.value)} placeholder="vpc-123" />
            </FormField>
          )}
          <FormField label="Description (optional)">
            <Input value={nsDesc} onChange={({ detail }) => setNsDesc(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  Athena
// ────────────────────────────────────────────────────────

