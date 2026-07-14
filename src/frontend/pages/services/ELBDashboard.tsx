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
  useELBSetSecurityGroups,
  useELBSetSubnets,
  useELBSetIpAddressType,
  useELBSSLPolicies,
  useELBListenerCertificates,
  useELBAddListenerCertificate,
  useELBRemoveListenerCertificate,
  useELBListenerAttributes,
  useELBModifyListenerAttributes,
  useELBTargetGroupAttributes,
  useELBModifyTargetGroupAttributes,
  useELBAccountLimits,
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

export function ELBDashboard() {
  const { data: lbs, isLoading: lbsLoading } = useELBLoadBalancers();
  const { data: tgs, isLoading: tgsLoading } = useELBTargetGroups();
  const createLB = useELBCreateLoadBalancer();
  const deleteLB = useELBDeleteLoadBalancer();
  const createTG = useELBCreateTargetGroup();
  const deleteTG = useELBDeleteTargetGroup();
  const [activeTab, setActiveTab] = useState("load-balancers");
  const [showCreateLB, setShowCreateLB] = useState(false);
  const [showCreateTG, setShowCreateTG] = useState(false);
  const [lbName, setLBName] = useState("");
  const [tgName, setTGName] = useState("");
  const [tgProtocol, setTGProtocol] = useState<SelectProps.Option>({ label: "HTTP", value: "HTTP" });
  const [tgPort, setTGPort] = useState("80");

  // ── Advanced Settings State ──
  const [selectedLBArn, setSelectedLBArn] = useState<string | null>(null);
  const [selectedListenerArn, setSelectedListenerArn] = useState<string | null>(null);
  const [selectedTGArn, setSelectedTGArn] = useState<string | null>(null);
  const [sgList, setSgList] = useState("");
  const [subnetList, setSubnetList] = useState("");
  const [ipType, setIpType] = useState("");
  const [certArn, setCertArn] = useState("");
  const [showSgModal, setShowSgModal] = useState(false);
  const [showSubnetModal, setShowSubnetModal] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const setSgs = useELBSetSecurityGroups();
  const setSubnets = useELBSetSubnets();
  const setIpAddrType = useELBSetIpAddressType();
  const sslPolicies = useELBSSLPolicies();
  const listenerCerts = useELBListenerCertificates(selectedListenerArn);
  const addCert = useELBAddListenerCertificate();
  const removeCert = useELBRemoveListenerCertificate();
  const listenerAttrs = useELBListenerAttributes(selectedListenerArn);
  const modifyListenerAttrs = useELBModifyListenerAttributes();
  const tgAttrs = useELBTargetGroupAttributes(selectedTGArn);
  const modifyTgAttrs = useELBModifyTargetGroupAttributes();
  const accountLimits = useELBAccountLimits();
  const selectedLBListeners = useELBListeners(selectedLBArn);

  const PROTOCOL_OPTIONS: SelectProps.Option[] = [
    { label: "HTTP", value: "HTTP" },
    { label: "HTTPS", value: "HTTPS" },
    { label: "TCP", value: "TCP" },
    { label: "TLS", value: "TLS" },
    { label: "UDP", value: "UDP" },
    { label: "TCP_UDP", value: "TCP_UDP" },
  ];

  if (lbsLoading || tgsLoading) return <TableSkeleton />;

  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      tabs={[
        {
          id: "load-balancers",
          label: "Load Balancers",
          content: (
            <>
              <ResourceTable
                resourceName="Load Balancer"
                headerTitle="Load Balancers"
                headerCounter={lbs?.total}
                items={(lbs?.loadBalancers || []).map((lb: any) => ({
                  name: lb.loadBalancerName,
                  arn: lb.loadBalancerArn,
                  type: lb.type,
                  scheme: lb.scheme,
                  state: lb.state?.Code || "unknown",
                }))}
                loading={lbsLoading}
                onCreate={() => setShowCreateLB(true)}
                emptyMessage="No load balancers"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (item: any) => item.name,
                    isRowHeader: true,
                  },
                  { id: "type", header: "Type", cell: (item: any) => item.type },
                  { id: "scheme", header: "Scheme", cell: (item: any) => item.scheme },
                  { id: "state", header: "State", cell: (item: any) => item.state },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="load balancer"
                        loading={deleteLB.isPending && deleteLB.variables === item.arn}
                        onDelete={() => deleteLB.mutateAsync(item.arn)}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find load balancers by name"
                filterFunction={(item: any, searchText: string) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase())
                }
              />
              <Modal
                visible={showCreateLB}
                onDismiss={() => setShowCreateLB(false)}
                header="Create load balancer"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowCreateLB(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          createLB.mutate({
                            name: lbName,
                            type: "application",
                            scheme: "internet-facing",
                            subnets: ["subnet-12345678"],
                          });
                          setShowCreateLB(false);
                          setLBName("");
                        }}
                        disabled={!lbName}
                        loading={createLB.isPending}
                      >
                        Create
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Load balancer name">
                    <Input
                      value={lbName}
                      onChange={({ detail }) => setLBName(detail.value)}
                      placeholder="my-lb"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ),
        },
        {
          id: "target-groups",
          label: "Target Groups",
          content: (
            <>
              <ResourceTable
                resourceName="Target Group"
                headerTitle="Target Groups"
                headerCounter={tgs?.total}
                items={(tgs?.targetGroups || []).map((tg: any) => ({
                  name: tg.targetGroupName,
                  arn: tg.targetGroupArn,
                  protocol: tg.protocol || "-",
                  port: tg.port || "-",
                  targetType: tg.targetType || "-",
                }))}
                loading={tgsLoading}
                onCreate={() => setShowCreateTG(true)}
                emptyMessage="No target groups"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (item: any) => item.name,
                    isRowHeader: true,
                  },
                  { id: "protocol", header: "Protocol", cell: (item: any) => item.protocol },
                  { id: "port", header: "Port", cell: (item: any) => item.port },
                  { id: "targetType", header: "Target Type", cell: (item: any) => item.targetType },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="target group"
                        loading={deleteTG.isPending && deleteTG.variables === item.arn}
                        onDelete={() => deleteTG.mutateAsync(item.arn)}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find target groups by name"
                filterFunction={(item: any, searchText: string) =>
                  item.name.toLowerCase().includes(searchText.toLowerCase())
                }
              />
              <Modal
                visible={showCreateTG}
                onDismiss={() => setShowCreateTG(false)}
                header="Create target group"
                footer={
                  <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="link" onClick={() => setShowCreateTG(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          createTG.mutate({
                            name: tgName,
                            protocol: tgProtocol.value as string,
                            port: parseInt(tgPort),
                            vpcId: "vpc-default",
                          });
                          setShowCreateTG(false);
                          setTGName("");
                        }}
                        disabled={!tgName}
                        loading={createTG.isPending}
                      >
                        Create
                      </Button>
                    </SpaceBetween>
                  </Box>
                }
              >
                <Form>
                  <FormField label="Target group name">
                    <Input
                      value={tgName}
                      onChange={({ detail }) => setTGName(detail.value)}
                      placeholder="my-tg"
                    />
                  </FormField>
                  <FormField label="Protocol">
                    <Select
                      selectedOption={tgProtocol}
                      onChange={({ detail }) => setTGProtocol(detail.selectedOption)}
                      options={PROTOCOL_OPTIONS}
                    />
                  </FormField>
                  <FormField label="Port">
                    <Input
                      value={tgPort}
                      onChange={({ detail }) => setTGPort(detail.value)}
                      inputMode="numeric"
                    />
                  </FormField>
                </Form>
              </Modal>
            </>
          ),
        },
        {
          id: "advanced",
          label: "Advanced",
          content: (
            <SpaceBetween size="l">
              {/* SSL Policies */}
              <Container header={<Header variant="h2" counter={sslPolicies.data?.total}>SSL Policies</Header>}>
                <ResourceTable
                  resourceName="SSL Policy"
                  items={(sslPolicies.data?.sslPolicies || []).map((p: any) => ({
                    name: p.name,
                    sslProtocols: (p.sslProtocols || []).join(", "),
                    ciphers: (p.ciphers || []).length + " ciphers",
                  }))}
                  columns={[
                    { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
                    { id: "protocols", header: "SSL Protocols", cell: (item: any) => item.sslProtocols },
                    { id: "ciphers", header: "Ciphers", cell: (item: any) => item.ciphers },
                  ]}
                  loading={sslPolicies.isLoading}
                  emptyMessage="No SSL policies found"
                />
              </Container>

              {/* Account Limits */}
              <Container header={<Header variant="h2" counter={accountLimits.data?.total}>Account Limits</Header>}>
                <ResourceTable
                  resourceName="Limit"
                  items={(accountLimits.data?.limits || []).map((l: any) => ({
                    name: l.name,
                    max: l.max,
                  }))}
                  columns={[
                    { id: "name", header: "Limit", cell: (item: any) => item.name, isRowHeader: true },
                    { id: "max", header: "Maximum", cell: (item: any) => item.max },
                  ]}
                  loading={accountLimits.isLoading}
                  emptyMessage="No limits found"
                />
              </Container>

              {/* LB Advanced Settings */}
              <Container header={<Header variant="h2">Load Balancer Advanced Settings</Header>}>
                <SpaceBetween size="m">
                  <FormField label="Select Load Balancer">
                    <Select
                      selectedOption={selectedLBArn ? { label: selectedLBArn, value: selectedLBArn } : null}
                      onChange={({ detail }) => setSelectedLBArn(detail.selectedOption?.value || null)}
                      options={(lbs?.loadBalancers || []).map((lb: any) => ({
                        label: lb.loadBalancerName + " (" + lb.loadBalancerArn + ")",
                        value: lb.loadBalancerArn,
                      }))}
                      placeholder="Select a load balancer..."
                    />
                  </FormField>

                  {selectedLBArn && (
                    <SpaceBetween size="l">
                      {/* Security Groups */}
                      <Box>
                        <Header variant="h3" actions={<Button onClick={() => setShowSgModal(true)}>Edit</Button>}>
                          Security Groups
                        </Header>
                        <Button variant="link" onClick={() => setShowSgModal(true)}>Set security groups</Button>
                      </Box>

                      {/* Subnets */}
                      <Box>
                        <Header variant="h3" actions={<Button onClick={() => setShowSubnetModal(true)}>Edit</Button>}>
                          Subnets
                        </Header>
                        <Button variant="link" onClick={() => setShowSubnetModal(true)}>Set subnets</Button>
                      </Box>

                      {/* IP Address Type */}
                      <Box>
                        <Header variant="h3">IP Address Type</Header>
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => setIpAddrType.mutate({ arn: selectedLBArn, ipAddressType: "ipv4" })}>
                            Set IPv4
                          </Button>
                          <Button onClick={() => setIpAddrType.mutate({ arn: selectedLBArn, ipAddressType: "dualstack" })}>
                            Set Dualstack
                          </Button>
                        </SpaceBetween>
                      </Box>

                      {/* Listeners + Certificates */}
                      <Box>
                        <Header variant="h3">Listeners</Header>
                        {selectedLBListeners.data?.listeners?.length ? (
                          <SpaceBetween size="s">
                            {selectedLBListeners.data.listeners.map((l: any) => (
                              <Box key={l.listenerArn}>
                                <Box variant="awsui-key-label">{l.protocol}:{l.port}</Box>
                                <SpaceBetween direction="horizontal" size="xs">
                                  <Button variant="link" onClick={() => {
                                    setSelectedListenerArn(l.listenerArn);
                                    setSelectedTGArn(null);
                                  }}>
                                    Certificates
                                  </Button>
                                  <Button variant="link" onClick={() => {
                                    setSelectedListenerArn(l.listenerArn);
                                    setSelectedTGArn(null);
                                  }}>
                                    Attributes
                                  </Button>
                                </SpaceBetween>
                              </Box>
                            ))}
                          </SpaceBetween>
                        ) : (
                          <Box variant="small" color="text-status-inactive">No listeners found.</Box>
                        )}
                      </Box>

                      {/* Listener Certificates */}
                      {selectedListenerArn && listenerCerts.data && (
                        <Box>
                          <Header variant="h3" actions={<Button onClick={() => setShowCertModal(true)}>Add certificate</Button>}>
                            Listener Certificates
                          </Header>
                          {(listenerCerts.data.certificates || []).length === 0 ? (
                            <Box variant="small" color="text-status-inactive">No certificates</Box>
                          ) : (
                            <SpaceBetween size="xs">
                              {listenerCerts.data.certificates.map((c: any) => (
                                <Box key={c.CertificateArn}>
                                  <Box variant="small">{c.CertificateArn}</Box>
                                  <DeleteButton
                                    itemName={c.CertificateArn}
                                    resourceType="certificate"
                                    onDelete={() => removeCert.mutateAsync({ listenerArn: selectedListenerArn, certificateArn: c.CertificateArn })}
                                  />
                                </Box>
                              ))}
                            </SpaceBetween>
                          )}
                        </Box>
                      )}

                      {/* Listener Attributes */}
                      {selectedListenerArn && listenerAttrs.data && (
                        <Box>
                          <Header variant="h3">Listener Attributes</Header>
                          <Box variant="small">
                            {JSON.stringify(listenerAttrs.data.attributes, null, 2)}
                          </Box>
                        </Box>
                      )}
                    </SpaceBetween>
                  )}
                </SpaceBetween>
              </Container>

              {/* Target Group Attributes */}
              <Container header={<Header variant="h2">Target Group Attributes</Header>}>
                <SpaceBetween size="m">
                  <FormField label="Select Target Group">
                    <Select
                      selectedOption={selectedTGArn ? { label: selectedTGArn, value: selectedTGArn } : null}
                      onChange={({ detail }) => setSelectedTGArn(detail.selectedOption?.value || null)}
                      options={(tgs?.targetGroups || []).map((tg: any) => ({
                        label: tg.targetGroupName,
                        value: tg.targetGroupArn,
                      }))}
                      placeholder="Select a target group..."
                    />
                  </FormField>
                  {selectedTGArn && tgAttrs.data && (
                    <Box variant="small">
                      <pre>{JSON.stringify(tgAttrs.data.attributes, null, 2)}</pre>
                    </Box>
                  )}
                </SpaceBetween>
              </Container>

              {/* Modals */}
              {showSgModal && (
                <Modal visible onDismiss={() => setShowSgModal(false)} header="Set Security Groups" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowSgModal(false)}>Cancel</Button>
                    <Button variant="primary" loading={setSgs.isPending} onClick={() => {
                      if (selectedLBArn && sgList.trim()) {
                        setSgs.mutate({ arn: selectedLBArn, securityGroups: sgList.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean) }, { onSuccess: () => setShowSgModal(false) });
                      }
                    }} disabled={!sgList.trim()}>Save</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Security Group IDs" description="Comma or newline separated">
                    <Textarea value={sgList} onChange={({ detail }) => setSgList(detail.value)} placeholder="sg-12345678" rows={3} />
                  </FormField>
                </Modal>
              )}
              {showSubnetModal && (
                <Modal visible onDismiss={() => setShowSubnetModal(false)} header="Set Subnets" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowSubnetModal(false)}>Cancel</Button>
                    <Button variant="primary" loading={setSubnets.isPending} onClick={() => {
                      if (selectedLBArn && subnetList.trim()) {
                        setSubnets.mutate({ arn: selectedLBArn, subnets: subnetList.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean) }, { onSuccess: () => setShowSubnetModal(false) });
                      }
                    }} disabled={!subnetList.trim()}>Save</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Subnet IDs" description="Comma or newline separated">
                    <Textarea value={subnetList} onChange={({ detail }) => setSubnetList(detail.value)} placeholder="subnet-12345678" rows={3} />
                  </FormField>
                </Modal>
              )}
              {showCertModal && (
                <Modal visible onDismiss={() => setShowCertModal(false)} header="Add Listener Certificate" size="medium" footer={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => setShowCertModal(false)}>Cancel</Button>
                    <Button variant="primary" loading={addCert.isPending} onClick={() => {
                      if (selectedListenerArn && certArn.trim()) {
                        addCert.mutate({ listenerArn: selectedListenerArn, certificateArn: certArn.trim() }, { onSuccess: () => { setShowCertModal(false); setCertArn(""); } });
                      }
                    }} disabled={!certArn.trim()}>Add</Button>
                  </SpaceBetween>
                }>
                  <FormField label="Certificate ARN">
                    <Input value={certArn} onChange={({ detail }) => setCertArn(detail.value)} placeholder="arn:aws:acm:..." />
                  </FormField>
                </Modal>
              )}
            </SpaceBetween>
          ),
        },
      ]}
    />
  );
}

// ────────────────────────────────────────────────────────
//  SES
// ────────────────────────────────────────────────────────

