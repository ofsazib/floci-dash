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
  useUpdateWebACL,
  useCheckCapacity,
  useIPSets,
  useCreateIPSet,
  useDeleteIPSet,
  useRegexPatternSets,
  useRegexPatternSet,
  useCreateRegexPatternSet,
  useUpdateRegexPatternSet,
  useDeleteRegexPatternSet,
  useRuleGroups,
  useCreateRuleGroup,
  useDeleteRuleGroup,
  useLoggingConfigurations,
  usePutLoggingConfiguration,
  useDeleteLoggingConfiguration,
  useAssociateWebACL,
  useDisassociateWebACL,
  useGetWebACLForResource,
  useResourcesForWebACL,
  usePermissionPolicy,
  usePutPermissionPolicy,
  useDeletePermissionPolicy,
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

export function WafV2Dashboard() {
  const webAclsQuery = useWebACLs();
  const createWebAcl = useCreateWebACL();
  const deleteWebAcl = useDeleteWebACL();
  const updateWebAcl = useUpdateWebACL();
  const checkCapacity = useCheckCapacity();
  const ipSetsQuery = useIPSets();
  const createIPSet = useCreateIPSet();
  const deleteIPSet = useDeleteIPSet();
  const regexSetsQuery = useRegexPatternSets();
  const createRegexSet = useCreateRegexPatternSet();
  const updateRegexSet = useUpdateRegexPatternSet();
  const deleteRegexSet = useDeleteRegexPatternSet();
  const ruleGroupsQuery = useRuleGroups();
  const createRuleGroup = useCreateRuleGroup();
  const deleteRuleGroup = useDeleteRuleGroup();
  const [showCreate, setShowCreate] = useState(false);
  const [aclName, setAclName] = useState("");
  const [editWebAcl, setEditWebAcl] = useState<{ id: string; name: string; description: string } | null>(null);
  const [editRules, setEditRules] = useState("[]");
  const [editDefaultAction, setEditDefaultAction] = useState<SelectProps.Option>({ label: "Allow", value: "Allow" });
  const [editError, setEditError] = useState<string | null>(null);
  const [capacityResult, setCapacityResult] = useState<number | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [showCreateIPSet, setShowCreateIPSet] = useState(false);
  const [showCreateRegexSet, setShowCreateRegexSet] = useState(false);
  const [editRegexSet, setEditRegexSet] = useState<{ id: string; name: string } | null>(null);
  const [showCreateRuleGroup, setShowCreateRuleGroup] = useState(false);
  const { showToast } = useToast();

  // ── Logging + Associations + Permission Policy ──
  const loggingConfigsQuery = useLoggingConfigurations();
  const putLoggingConfig = usePutLoggingConfiguration();
  const deleteLoggingConfig = useDeleteLoggingConfiguration();
  const associateWebACL = useAssociateWebACL();
  const disassociateWebACL = useDisassociateWebACL();
  const putPermission = usePutPermissionPolicy();
  const deletePermission = useDeletePermissionPolicy();
  const [showPutLogging, setShowPutLogging] = useState(false);
  const [showAssociate, setShowAssociate] = useState(false);
  const [showDisassociate, setShowDisassociate] = useState(false);
  const [showPutPermission, setShowPutPermission] = useState(false);
  const [lookupResourceArn, setLookupResourceArn] = useState("");
  const [lookupWebACLArn, setLookupWebACLArn] = useState("");
  const [permissionResourceArn, setPermissionResourceArn] = useState("");
  const [submittedResourceArn, setSubmittedResourceArn] = useState("");
  const [submittedWebACLArn, setSubmittedWebACLArn] = useState("");
  const [submittedPermissionArn, setSubmittedPermissionArn] = useState("");
  const webAclForResourceQuery = useGetWebACLForResource(submittedResourceArn || null);
  const resourcesForWebAclQuery = useResourcesForWebACL(submittedWebACLArn || null);
  const permissionQuery = usePermissionPolicy(submittedPermissionArn || null);

  const webAcls = (webAclsQuery.data?.webAcls || []).map((a: any) => ({
    name: a.Name,
    id: a.Id,
    description: a.Description || "\u2014",
    arn: a.ARN || "\u2014",
  }));

  const ipSets = (ipSetsQuery.data?.ipSets || []).map((s: any) => ({
    name: s.Name,
    id: s.Id,
    description: s.Description || "\u2014",
  }));

  const regexSets = (regexSetsQuery.data?.regexPatternSets || []).map((s: any) => ({
    name: s.Name,
    id: s.Id,
    description: s.Description || "\u2014",
  }));

  const ruleGroups = (ruleGroupsQuery.data?.ruleGroups || []).map((g: any) => ({
    name: g.Name,
    id: g.Id,
    description: g.Description || "\u2014",
  }));

  function handleCreate() {
    createWebAcl.mutate(
      { Name: aclName.trim(), Scope: "REGIONAL", DefaultAction: { Allow: {} } },
      {
        onSuccess: () => {
          setShowCreate(false);
          setAclName("");
        },
      }
    );
  }

  function handleEdit() {
    let rules: any[];
    try {
      rules = JSON.parse(editRules || "[]");
    } catch {
      setEditError("Rules must be valid JSON");
      return;
    }
    setEditError(null);
    updateWebAcl.mutate(
      {
        Id: editWebAcl!.id,
        Name: editWebAcl!.name,
        Scope: "REGIONAL",
        LockToken: "placeholder",
        Description: editWebAcl!.description === "\u2014" ? undefined : editWebAcl!.description,
        DefaultAction: editDefaultAction.value === "Block" ? { Block: {} } : { Allow: {} },
        Rules: rules,
      },
      {
        onSuccess: () => {
          setEditWebAcl(null);
          showToast("success", "Web ACL updated");
        },
        onError: (e) => setEditError((e as Error)?.message || "Failed to update web ACL"),
      }
    );
  }

  function handleCheckCapacity() {
    let rules: any[];
    try {
      rules = JSON.parse(editRules || "[]");
    } catch {
      setCapacityError("Rules must be valid JSON");
      return;
    }
    setCapacityError(null);
    setCapacityResult(null);
    checkCapacity.mutate(
      { Rules: rules, Scope: "REGIONAL" },
      {
        onSuccess: (data: any) => setCapacityResult(data.capacity),
        onError: (e) => setCapacityError((e as Error)?.message || "Capacity check failed"),
      }
    );
  }

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Web ACL"
        headerTitle="WAF v2 Web ACLs"
        headerCounter={webAclsQuery.data?.total}
        items={webAcls}
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => item.name,
            isRowHeader: true,
          },
          { id: "description", header: "Description", cell: (item: any) => item.description },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => {
                    setEditWebAcl({ id: item.id, name: item.name, description: item.description });
                    setEditRules("[]");
                    setEditDefaultAction({ label: "Allow", value: "Allow" });
                    setEditError(null);
                    setCapacityResult(null);
                    setCapacityError(null);
                  }}
                >
                  Edit
                </Button>
                <DeleteButton
                  itemName={item.name}
                  resourceType="web ACL"
                  loading={deleteWebAcl.isPending && deleteWebAcl.variables?.Name === item.name}
                  onDelete={() => deleteWebAcl.mutateAsync({ Id: item.id, Name: item.name, Scope: "REGIONAL", LockToken: "placeholder" })}
                />
              </SpaceBetween>
            ),
          },
        ]}
        loading={webAclsQuery.isLoading}
        emptyMessage="No web ACLs found"
        filterEnabled
        filterPlaceholder="Find web ACLs by name"
        filterFunction={(item: any, searchText: string) =>
          (item.name || "").toLowerCase().includes(searchText.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      <Container
        header={
          <Header
            variant="h3"
            counter={ipSetsQuery.data?.total}
            actions={<Button onClick={() => setShowCreateIPSet(true)}>Create IP set</Button>}
          >
            IP Sets
          </Header>
        }
      >
        <ResourceTable
          resourceName="IP Set"
          items={ipSets}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "description", header: "Description", cell: (item: any) => item.description },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.name}
                  resourceType="IP set"
                  loading={deleteIPSet.isPending && deleteIPSet.variables?.Name === item.name}
                  onDelete={() => deleteIPSet.mutateAsync({ Id: item.id, Name: item.name, Scope: "REGIONAL", LockToken: "placeholder" })}
                />
              ),
            },
          ]}
          loading={ipSetsQuery.isLoading}
          emptyMessage="No IP sets found"
        />
      </Container>

      <Container
        header={
          <Header
            variant="h3"
            counter={regexSetsQuery.data?.total}
            actions={<Button onClick={() => setShowCreateRegexSet(true)}>Create regex set</Button>}
          >
            Regex Pattern Sets
          </Header>
        }
      >
        <ResourceTable
          resourceName="Regex Pattern Set"
          items={regexSets}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "description", header: "Description", cell: (item: any) => item.description },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => setEditRegexSet({ id: item.id, name: item.name })}>Edit</Button>
                  <DeleteButton
                    itemName={item.name}
                    resourceType="regex set"
                    loading={deleteRegexSet.isPending && deleteRegexSet.variables?.Name === item.name}
                    onDelete={() => deleteRegexSet.mutateAsync({ Id: item.id, Name: item.name, Scope: "REGIONAL", LockToken: "placeholder" })}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          loading={regexSetsQuery.isLoading}
          emptyMessage="No regex pattern sets found"
        />
      </Container>

      <Container
        header={
          <Header
            variant="h3"
            counter={ruleGroupsQuery.data?.total}
            actions={<Button onClick={() => setShowCreateRuleGroup(true)}>Create rule group</Button>}
          >
            Rule Groups
          </Header>
        }
      >
        <ResourceTable
          resourceName="Rule Group"
          items={ruleGroups}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            { id: "description", header: "Description", cell: (item: any) => item.description },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.name}
                  resourceType="rule group"
                  loading={deleteRuleGroup.isPending && deleteRuleGroup.variables?.Name === item.name}
                  onDelete={() => deleteRuleGroup.mutateAsync({ Id: item.id, Name: item.name, Scope: "REGIONAL", LockToken: "placeholder" })}
                />
              ),
            },
          ]}
          loading={ruleGroupsQuery.isLoading}
          emptyMessage="No rule groups found"
        />
      </Container>

      {/* ── Logging Configuration ── */}
      <Container
        header={
          <Header
            variant="h3"
            counter={loggingConfigsQuery.data?.total}
            actions={<Button onClick={() => setShowPutLogging(true)}>Configure logging</Button>}
          >
            Logging Configuration
          </Header>
        }
      >
        <ResourceTable
          resourceName="Logging Config"
          items={(loggingConfigsQuery.data?.loggingConfigurations || []).map((lc: any) => ({
            resourceArn: lc.ResourceArn,
            logDestinations: (lc.LogDestinationConfigs || []).join(", ") || "\u2014",
            managedByFms: lc.ManagedByFirewallManager ? "Yes" : "No",
          }))}
          columns={[
            { id: "resourceArn", header: "Resource ARN", cell: (item: any) => item.resourceArn, isRowHeader: true },
            { id: "logDestinations", header: "Log Destinations", cell: (item: any) => item.logDestinations },
            { id: "managedByFms", header: "FMS Managed", cell: (item: any) => item.managedByFms },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.resourceArn}
                  resourceType="logging config"
                  loading={deleteLoggingConfig.isPending && deleteLoggingConfig.variables?.ResourceArn === item.resourceArn}
                  onDelete={() => deleteLoggingConfig.mutateAsync({ ResourceArn: item.resourceArn })}
                />
              ),
            },
          ]}
          loading={loggingConfigsQuery.isLoading}
          emptyMessage="No logging configurations found"
        />
      </Container>

      {/* ── Web ACL Associations ── */}
      <Container
        header={<Header variant="h3">Web ACL Associations</Header>}
      >
        <SpaceBetween size="m">
          <Box>
            <Box variant="awsui-key-label" padding={{ bottom: "xs" }}>Find Web ACL for Resource</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Input
                value={lookupResourceArn}
                onChange={({ detail }) => setLookupResourceArn(detail.value)}
                placeholder="arn:aws:elasticloadbalancing:..."
              />
              <Button onClick={() => setSubmittedResourceArn(lookupResourceArn.trim())} disabled={!lookupResourceArn.trim()}>
                Look up
              </Button>
            </SpaceBetween>
            {webAclForResourceQuery.data && (
              <Box padding={{ top: "s" }}>
                {webAclForResourceQuery.data.webAcl ? (
                  <Alert type="success" header="Associated Web ACL">
                    {webAclForResourceQuery.data.webAcl.Name} ({webAclForResourceQuery.data.webAcl.ARN})
                  </Alert>
                ) : (
                  <Alert type="info">No Web ACL associated with this resource.</Alert>
                )}
              </Box>
            )}
          </Box>
          <Box>
            <Box variant="awsui-key-label" padding={{ bottom: "xs" }}>List Resources for Web ACL</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Input
                value={lookupWebACLArn}
                onChange={({ detail }) => setLookupWebACLArn(detail.value)}
                placeholder="arn:aws:wafv2:...:webacl/..."
              />
              <Button onClick={() => setSubmittedWebACLArn(lookupWebACLArn.trim())} disabled={!lookupWebACLArn.trim()}>
                Look up
              </Button>
            </SpaceBetween>
            {resourcesForWebAclQuery.data && (
              <Box padding={{ top: "s" }}>
                {resourcesForWebAclQuery.data.resourceArns.length > 0 ? (
                  <ul>
                    {resourcesForWebAclQuery.data.resourceArns.map((arn: string) => (
                      <li key={arn} style={{ fontSize: 13, wordBreak: "break-all" }}>{arn}</li>
                    ))}
                  </ul>
                ) : (
                  <Alert type="info">No resources associated with this Web ACL.</Alert>
                )}
              </Box>
            )}
          </Box>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setShowAssociate(true)}>Associate Web ACL</Button>
            <Button onClick={() => setShowDisassociate(true)}>Disassociate Web ACL</Button>
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      {/* ── Permission Policy ── */}
      <Container
        header={<Header variant="h3">Permission Policy</Header>}
      >
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="xs">
            <Input
              value={permissionResourceArn}
              onChange={({ detail }) => setPermissionResourceArn(detail.value)}
              placeholder="arn:aws:wafv2:...:webacl/..."
            />
            <Button onClick={() => setSubmittedPermissionArn(permissionResourceArn.trim())} disabled={!permissionResourceArn.trim()}>
              Load policy
            </Button>
            <Button onClick={() => setShowPutPermission(true)}>Put policy</Button>
            <DeleteButton
              itemName={permissionResourceArn}
              resourceType="permission policy"
              loading={deletePermission.isPending && deletePermission.variables?.ResourceArn === permissionResourceArn}
              onDelete={() => deletePermission.mutateAsync({ ResourceArn: permissionResourceArn.trim() })}
            />
          </SpaceBetween>
          {permissionQuery.data && (
            <Box>
              {permissionQuery.data.policy ? (
                <pre style={{ fontSize: 12, padding: 12, background: "#f8f8f8", borderRadius: 4, overflow: "auto", maxHeight: 300 }}>
                  {permissionQuery.data.policy}
                </pre>
              ) : (
                <Alert type="info">No permission policy set for this resource.</Alert>
              )}
            </Box>
          )}
        </SpaceBetween>
      </Container>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Web ACL"
        size="medium"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!aclName.trim()}>Create</Button>
          </SpaceBetween>
        }
      >
        <FormField label="Web ACL name">
          <Input value={aclName} onChange={({ detail }) => setAclName(detail.value)} placeholder="my-web-acl" />
        </FormField>
      </Modal>

      {editWebAcl && (
        <Modal
          visible
          onDismiss={() => setEditWebAcl(null)}
          header={`Edit Web ACL — ${editWebAcl.name}`}
          size="large"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setEditWebAcl(null)}>Cancel</Button>
              <Button variant="normal" onClick={handleCheckCapacity}>Check capacity</Button>
              <Button variant="primary" loading={updateWebAcl.isPending} onClick={handleEdit} disabled={checkCapacity.isPending}>
                Save
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            {editError && (
              <Alert type="error" dismissible onDismiss={() => setEditError(null)}>
                {editError}
              </Alert>
            )}
            {capacityError && (
              <Alert type="error" dismissible onDismiss={() => setCapacityError(null)}>
                {capacityError}
              </Alert>
            )}
            {capacityResult !== null && (
              <Alert type="success" dismissible onDismiss={() => setCapacityResult(null)}>
                Capacity: {capacityResult} units
              </Alert>
            )}
            <FormField label="Description">
              <Input
                value={editWebAcl.description === "\u2014" ? "" : editWebAcl.description}
                onChange={({ detail }) =>
                  setEditWebAcl({ ...editWebAcl, description: detail.value })
                }
                placeholder="Optional description"
              />
            </FormField>
            <FormField label="Default action">
              <Select
                selectedOption={editDefaultAction}
                onChange={({ detail }) => setEditDefaultAction(detail.selectedOption)}
                options={[
                  { label: "Allow", value: "Allow" },
                  { label: "Block", value: "Block" },
                ]}
              />
            </FormField>
            <FormField label="Rules (JSON array)" description="Paste the rules as a JSON array — Check capacity validates them">
              <Textarea
                value={editRules}
                onChange={({ detail }) => setEditRules(detail.value)}
                placeholder='[{"Name": "rule-1", "Priority": 1, ...}]'
                rows={6}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {showCreateIPSet && (
        <CreateIPSetModal
          onClose={() => setShowCreateIPSet(false)}
          onCreated={() => { setShowCreateIPSet(false); showToast("success", "IP set created"); }}
          createIPSet={createIPSet}
        />
      )}

      {showCreateRegexSet && (
        <CreateRegexSetModal
          onClose={() => setShowCreateRegexSet(false)}
          onCreated={() => { setShowCreateRegexSet(false); showToast("success", "Regex pattern set created"); }}
          createRegexSet={createRegexSet}
        />
      )}

      {editRegexSet && (
        <EditRegexSetModal
          id={editRegexSet.id}
          name={editRegexSet.name}
          onClose={() => setEditRegexSet(null)}
          onUpdated={() => { setEditRegexSet(null); showToast("success", "Regex pattern set updated"); }}
          updateRegexSet={updateRegexSet}
        />
      )}

      {showCreateRuleGroup && (
        <CreateRuleGroupModal
          onClose={() => setShowCreateRuleGroup(false)}
          onCreated={() => { setShowCreateRuleGroup(false); showToast("success", "Rule group created"); }}
          createRuleGroup={createRuleGroup}
        />
      )}

      {/* ── Logging Configuration Modal ── */}
      {showPutLogging && (
        <PutLoggingConfigModal
          onClose={() => setShowPutLogging(false)}
          onCreated={() => { setShowPutLogging(false); showToast("success", "Logging configuration saved"); }}
          putLoggingConfig={putLoggingConfig}
        />
      )}

      {/* ── Associate Web ACL Modal ── */}
      {showAssociate && (
        <AssociateWebACLModal
          onClose={() => setShowAssociate(false)}
          onCreated={() => { setShowAssociate(false); showToast("success", "Web ACL associated"); }}
          associateWebACL={associateWebACL}
        />
      )}

      {/* ── Disassociate Web ACL Modal ── */}
      {showDisassociate && (
        <DisassociateWebACLModal
          onClose={() => setShowDisassociate(false)}
          onCreated={() => { setShowDisassociate(false); showToast("success", "Web ACL disassociated"); }}
          disassociateWebACL={disassociateWebACL}
        />
      )}

      {/* ── Put Permission Policy Modal ── */}
      {showPutPermission && (
        <PutPermissionPolicyModal
          onClose={() => setShowPutPermission(false)}
          onCreated={() => { setShowPutPermission(false); showToast("success", "Permission policy saved"); }}
          putPermission={putPermission}
        />
      )}
    </SpaceBetween>
  );
}

function CreateIPSetModal({
  onClose,
  onCreated,
  createIPSet,
}: {
  onClose: () => void;
  onCreated: () => void;
  createIPSet: ReturnType<typeof useCreateIPSet>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addresses, setAddresses] = useState("");

  function handleCreate() {
    const addrList = addresses
      .split(/[,\n\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    createIPSet.mutate(
      { Name: name.trim(), Scope: "REGIONAL", Description: description.trim() || undefined, IPAddressVersion: "IPV4", Addresses: addrList },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Create IP Set" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={createIPSet.isPending} onClick={handleCreate} disabled={!name.trim()}>Create</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Name"><Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-ip-set" /></FormField>
        <FormField label="Description (optional)"><Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="Blocked IPs" /></FormField>
        <FormField label="IP addresses" description="CIDR notation, comma or newline separated">
          <Textarea value={addresses} onChange={({ detail }) => setAddresses(detail.value)} placeholder="10.0.0.0/8" rows={3} />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

function CreateRegexSetModal({
  onClose,
  onCreated,
  createRegexSet,
}: {
  onClose: () => void;
  onCreated: () => void;
  createRegexSet: ReturnType<typeof useCreateRegexPatternSet>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [patterns, setPatterns] = useState("");

  function handleCreate() {
    const patternList = patterns
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ RegexString: s }));
    createRegexSet.mutate(
      { Name: name.trim(), Scope: "REGIONAL", Description: description.trim() || undefined, RegularExpressionList: patternList },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Create Regex Pattern Set" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={createRegexSet.isPending} onClick={handleCreate} disabled={!name.trim()}>Create</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Name"><Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-regex-set" /></FormField>
        <FormField label="Description (optional)"><Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="SQL injection patterns" /></FormField>
        <FormField label="Regex patterns" description="One per line">
          <Textarea value={patterns} onChange={({ detail }) => setPatterns(detail.value)} placeholder=".*union.*select.*" rows={3} />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

function EditRegexSetModal({
  id,
  name,
  onClose,
  onUpdated,
  updateRegexSet,
}: {
  id: string;
  name: string;
  onClose: () => void;
  onUpdated: () => void;
  updateRegexSet: ReturnType<typeof useUpdateRegexPatternSet>;
}) {
  const getQuery = useRegexPatternSet(id, name, "REGIONAL");
  const [description, setDescription] = useState("");
  const [patterns, setPatterns] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (getQuery.data?.regexPatternSet && !initialized) {
      const set = getQuery.data.regexPatternSet;
      setDescription(set.Description || "");
      setPatterns(
        (set.RegularExpressionList || [])
          .map((r: any) => r.RegexString)
          .filter(Boolean)
          .join("\n")
      );
      setInitialized(true);
    }
  }, [getQuery.data, initialized]);

  const lockToken = getQuery.data?.regexPatternSet?.LockToken;

  function handleSave() {
    const patternList = patterns
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ RegexString: s }));
    updateRegexSet.mutate(
      {
        Id: id,
        Name: name,
        Scope: "REGIONAL",
        LockToken: lockToken,
        Description: description.trim() || undefined,
        RegularExpressionList: patternList,
      },
      { onSuccess: onUpdated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header={`Edit Regex Pattern Set: ${name}`} size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={updateRegexSet.isPending} onClick={handleSave} disabled={!lockToken}>Save</Button>
      </SpaceBetween>
    }>
      {getQuery.isLoading ? (
        <Spinner />
      ) : getQuery.isError ? (
        <Alert type="error">Failed to load regex pattern set.</Alert>
      ) : (
        <SpaceBetween size="m">
          <FormField label="Description (optional)"><Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="SQL injection patterns" /></FormField>
          <FormField label="Regex patterns" description="One per line">
            <Textarea value={patterns} onChange={({ detail }) => setPatterns(detail.value)} placeholder=".*union.*select.*" rows={3} />
          </FormField>
        </SpaceBetween>
      )}
    </Modal>
  );
}

function CreateRuleGroupModal({
  onClose,
  onCreated,
  createRuleGroup,
}: {
  onClose: () => void;
  onCreated: () => void;
  createRuleGroup: ReturnType<typeof useCreateRuleGroup>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState(100);

  function handleCreate() {
    createRuleGroup.mutate(
      { Name: name.trim(), Scope: "REGIONAL", Description: description.trim() || undefined, Capacity: capacity },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Create Rule Group" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={createRuleGroup.isPending} onClick={handleCreate} disabled={!name.trim()}>Create</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Name"><Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-rule-group" /></FormField>
        <FormField label="Description (optional)"><Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="Rate limiting rules" /></FormField>
        <FormField label="Capacity" description="Maximum WCU capacity">
          <Input value={String(capacity)} onChange={({ detail }) => setCapacity(Number(detail.value) || 100)} type="number" />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ── Logging Configuration Modal ──

function PutLoggingConfigModal({
  onClose,
  onCreated,
  putLoggingConfig,
}: {
  onClose: () => void;
  onCreated: () => void;
  putLoggingConfig: ReturnType<typeof usePutLoggingConfiguration>;
}) {
  const [resourceArn, setResourceArn] = useState("");
  const [logDestinations, setLogDestinations] = useState("");

  function handleSave() {
    const destinations = logDestinations.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
    putLoggingConfig.mutate(
      { ResourceArn: resourceArn.trim(), LogDestinationConfigs: destinations },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Configure Logging" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={putLoggingConfig.isPending} onClick={handleSave} disabled={!resourceArn.trim() || !logDestinations.trim()}>Save</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Resource ARN">
          <Input value={resourceArn} onChange={({ detail }) => setResourceArn(detail.value)} placeholder="arn:aws:wafv2:...:webacl/..." />
        </FormField>
        <FormField label="Log Destination ARNs" description="ARNs of CloudWatch Logs groups, S3 buckets, or Kinesis Firehose. Comma or newline separated.">
          <Textarea value={logDestinations} onChange={({ detail }) => setLogDestinations(detail.value)} placeholder="arn:aws:logs:..." rows={3} />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ── Associate Web ACL Modal ──

function AssociateWebACLModal({
  onClose,
  onCreated,
  associateWebACL,
}: {
  onClose: () => void;
  onCreated: () => void;
  associateWebACL: ReturnType<typeof useAssociateWebACL>;
}) {
  const [webACLArn, setWebACLArn] = useState("");
  const [resourceArn, setResourceArn] = useState("");

  function handleAssociate() {
    associateWebACL.mutate(
      { WebACLArn: webACLArn.trim(), ResourceArn: resourceArn.trim() },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Associate Web ACL" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={associateWebACL.isPending} onClick={handleAssociate} disabled={!webACLArn.trim() || !resourceArn.trim()}>Associate</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Web ACL ARN">
          <Input value={webACLArn} onChange={({ detail }) => setWebACLArn(detail.value)} placeholder="arn:aws:wafv2:...:webacl/..." />
        </FormField>
        <FormField label="Resource ARN">
          <Input value={resourceArn} onChange={({ detail }) => setResourceArn(detail.value)} placeholder="arn:aws:elasticloadbalancing:..." />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ── Disassociate Web ACL Modal ──

function DisassociateWebACLModal({
  onClose,
  onCreated,
  disassociateWebACL,
}: {
  onClose: () => void;
  onCreated: () => void;
  disassociateWebACL: ReturnType<typeof useDisassociateWebACL>;
}) {
  const [resourceArn, setResourceArn] = useState("");

  function handleDisassociate() {
    disassociateWebACL.mutate(
      { ResourceArn: resourceArn.trim() },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Disassociate Web ACL" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={disassociateWebACL.isPending} onClick={handleDisassociate} disabled={!resourceArn.trim()}>Disassociate</Button>
      </SpaceBetween>
    }>
      <FormField label="Resource ARN">
        <Input value={resourceArn} onChange={({ detail }) => setResourceArn(detail.value)} placeholder="arn:aws:elasticloadbalancing:..." />
      </FormField>
    </Modal>
  );
}

// ── Put Permission Policy Modal ──

function PutPermissionPolicyModal({
  onClose,
  onCreated,
  putPermission,
}: {
  onClose: () => void;
  onCreated: () => void;
  putPermission: ReturnType<typeof usePutPermissionPolicy>;
}) {
  const [resourceArn, setResourceArn] = useState("");
  const [policy, setPolicy] = useState("");

  function handleSave() {
    putPermission.mutate(
      { ResourceArn: resourceArn.trim(), Policy: policy },
      { onSuccess: onCreated }
    );
  }

  return (
    <Modal visible onDismiss={onClose} header="Put Permission Policy" size="medium" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={putPermission.isPending} onClick={handleSave} disabled={!resourceArn.trim() || !policy.trim()}>Save</Button>
      </SpaceBetween>
    }>
      <SpaceBetween size="m">
        <FormField label="Resource ARN">
          <Input value={resourceArn} onChange={({ detail }) => setResourceArn(detail.value)} placeholder="arn:aws:wafv2:...:webacl/..." />
        </FormField>
        <FormField label="Policy (JSON string)">
          <Textarea value={policy} onChange={({ detail }) => setPolicy(detail.value)} placeholder='{"Version": "2012-10-17", ...}' rows={5} />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────
//  ElastiCache
// ────────────────────────────────────────────────────────

const ELASTICACHE_ENGINE_OPTIONS: SelectProps.Option[] = [
  { label: "Memcached", value: "memcached" },
];

