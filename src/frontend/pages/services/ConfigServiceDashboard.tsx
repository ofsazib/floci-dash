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
  useConfigRecorderStatuses,
  useConformancePacks,
  useDeleteConformancePack,
  useConformancePackStatuses,
  useComplianceByConfigRule,
  useConfigTags,
  useAddConfigTags,
  useRemoveConfigTags,
  useConfigRuleEvaluationStatus,
  useStartConfigRulesEvaluation,
  useAggregationAuthorizations,
  usePutAggregationAuthorization,
  useDeleteAggregationAuthorization,
  useRetentionConfigurations,
  usePutRetentionConfiguration,
  useDeleteRetentionConfiguration,
  useComplianceByResource,
  useComplianceSummaryByConfigRule,
  useComplianceSummaryByResourceType,
  useComplianceDetailsByConfigRule,
  useComplianceDetailsByResource,
  useDeleteDeliveryChannel,
  useDeleteEvaluationResults,
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

function ConfigTagsModal({
  target,
  onClose,
}: {
  target: { arn: string; name: string };
  onClose: () => void;
}) {
  const { data } = useConfigTags(target.arn);
  const addTags = useAddConfigTags();
  const removeTags = useRemoveConfigTags();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const tags = data?.tags || [];

  return (
    <Modal
      visible
      onDismiss={onClose}
      header={`Tags — ${target.name}`}
      footer={
        <Box float="right">
          <Button variant="link" onClick={onClose}>Close</Button>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {addTags.isError && (
          <Alert type="error" dismissible onDismiss={() => addTags.reset()}>
            {(addTags.error as Error)?.message || "Failed to add tags"}
          </Alert>
        )}
        {removeTags.isError && (
          <Alert type="error" dismissible onDismiss={() => removeTags.reset()}>
            {(removeTags.error as Error)?.message || "Failed to remove tag"}
          </Alert>
        )}
        <ResourceTable
          resourceName="Tag"
          headerTitle={`Tags (${tags.length})`}
          items={tags}
          columns={[
            { id: "key", header: "Key", cell: (t: any) => t.key, isRowHeader: true },
            { id: "value", header: "Value", cell: (t: any) => t.value },
            {
              id: "actions",
              header: "",
              cell: (t: any) => (
                <DeleteButton
                  itemName={t.key}
                  resourceType="tag"
                  loading={removeTags.isPending && removeTags.variables?.tagKeys?.[0] === t.key}
                  onDelete={() => removeTags.mutateAsync({ arn: target.arn, tagKeys: [t.key] })}
                />
              ),
            },
          ]}
          emptyMessage="No tags"
          loading={false}
        />
        <SpaceBetween direction="horizontal" size="xs">
          <FormField label="Key">
            <Input value={newKey} onChange={({ detail }) => setNewKey(detail.value)} placeholder="env" />
          </FormField>
          <FormField label="Value">
            <Input value={newValue} onChange={({ detail }) => setNewValue(detail.value)} placeholder="prod" />
          </FormField>
          <Button
            variant="primary"
            loading={addTags.isPending}
            disabled={!newKey.trim()}
            onClick={() =>
              addTags
                .mutateAsync({ arn: target.arn, tags: { [newKey.trim()]: newValue.trim() } })
                .then(() => {
                  setNewKey("");
                  setNewValue("");
                })
            }
          >
            Add tag
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Modal>
  );
}

export function ConfigServiceDashboard() {
  const { data: rulesData, isLoading } = useConfigRules();
  const deleteRule = useDeleteConfigRule();
  const { data: recordersData } = useConfigRecorders();
  const { data: recorderStatusesData } = useConfigRecorderStatuses();
  const { data: packsData } = useConformancePacks();
  const deletePack = useDeleteConformancePack();
  const { data: packStatusesData } = useConformancePackStatuses();
  const { data: complianceData } = useComplianceByConfigRule();
  const { data: evalStatusData } = useConfigRuleEvaluationStatus();
  const startEval = useStartConfigRulesEvaluation();
  const [tagsTarget, setTagsTarget] = useState<{ arn: string; name: string } | null>(null);

  if (isLoading) return <TableSkeleton />;

  return (
    <>
    <Tabs
      tabs={[
        {
          id: "rules",
          label: "Config Rules",
          content: (
            <ResourceTable
              resourceName="Config Rule"
              headerTitle="Config Rules"
              headerCounter={rulesData?.total}
              items={(rulesData?.rules || []).map((r: any) => ({
                name: r.ConfigRuleName,
                arn: r.ConfigRuleArn || "",
                state: r.ConfigRuleState || "ACTIVE",
                owner: r.Source?.Owner || "-",
                source: r.Source?.SourceIdentifier || "-",
              }))}
              loading={false}
              emptyMessage="No config rules"
              columns={[
                { id: "name", header: "Rule Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "state", header: "State", cell: (i: any) => i.state },
                { id: "owner", header: "Owner", cell: (i: any) => i.owner },
                { id: "source", header: "Source", cell: (i: any) => i.source },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button disabled={!i.arn} onClick={() => setTagsTarget({ arn: i.arn, name: i.name })}>
                        Tags
                      </Button>
                      <DeleteButton
                        itemName={i.name}
                        resourceType="config rule"
                        loading={deleteRule.isPending && deleteRule.variables === i.name}
                        onDelete={() => deleteRule.mutateAsync(i.name)}
                      />
                    </SpaceBetween>
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find rules"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "recorders",
          label: "Recorders",
          content: (
            <ResourceTable
              resourceName="Recorder"
              headerTitle="Configuration Recorders"
              headerCounter={recordersData?.total}
              items={(recordersData?.recorders || []).map((r: any) => ({
                name: r.name,
                role: r.roleARN,
                allSupported: r.recordingGroup?.allSupported ? "Yes" : "No",
              }))}
              loading={false}
              emptyMessage="No configuration recorders"
              columns={[
                { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "role", header: "Role ARN", cell: (i: any) => i.role },
                { id: "allSupported", header: "All Supported", cell: (i: any) => i.allSupported },
              ]}
            />
          ),
        },
        {
          id: "conformance-packs",
          label: "Conformance Packs",
          content: (
            <ResourceTable
              resourceName="Conformance Pack"
              headerTitle="Conformance Packs"
              headerCounter={packsData?.total}
              items={(packsData?.conformancePacks || []).map((p: any) => ({
                name: p.ConformancePackName,
                id: p.ConformancePackId || "-",
                arn: p.ConformancePackArn || "-",
              }))}
              loading={false}
              emptyMessage="No conformance packs"
              columns={[
                { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                { id: "id", header: "Pack ID", cell: (i: any) => i.id },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        disabled={!i.arn || i.arn === "-"}
                        onClick={() => setTagsTarget({ arn: i.arn, name: i.name })}
                      >
                        Tags
                      </Button>
                      <DeleteButton
                        itemName={i.name}
                        resourceType="conformance pack"
                        loading={deletePack.isPending && deletePack.variables === i.name}
                        onDelete={() => deletePack.mutateAsync(i.name)}
                      />
                    </SpaceBetween>
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find packs"
              filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "governance",
          label: "Governance",
          content: <GovernanceTab />,
        },
        {
          id: "advanced",
          label: "Advanced",
          content: (
            <SpaceBetween size="l">
              {/* ── Compliance by Rule ──────────────────── */}
              <ResourceTable
                resourceName="Compliance"
                headerTitle="Compliance by Config Rule"
                headerCounter={complianceData?.total}
                items={(complianceData?.compliance || []).map((c: any) => ({
                  name: c.ConfigRuleName,
                  compliance: c.Compliance?.ComplianceType || "-",
                  contributorCount: c.Compliance?.ContributorCount?.CappedCount ?? "-",
                }))}
                loading={false}
                emptyMessage="No compliance data"
                columns={[
                  { id: "name", header: "Rule Name", cell: (i: any) => i.name, isRowHeader: true },
                  {
                    id: "compliance",
                    header: "Compliance",
                    cell: (i: any) => (
                      <StatusIndicator type={i.compliance === "COMPLIANT" ? "success" : i.compliance === "NON_COMPLIANT" ? "error" : "warning"}>
                        {i.compliance}
                      </StatusIndicator>
                    ),
                  },
                  { id: "contributorCount", header: "Resources", cell: (i: any) => i.contributorCount },
                ]}
                filterEnabled
                filterPlaceholder="Find rules"
                filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
              />

              {/* ── Evaluation Status ───────────────────── */}
              <Box margin={{ top: "s" }}>
                <SpaceBetween direction="horizontal" size="s">
                  <Box variant="h3">Evaluation Status</Box>
                  <Button
                    iconName="play"
                    variant="primary"
                    loading={startEval.isPending}
                    onClick={() => startEval.mutateAsync(undefined)}
                  >
                    Evaluate All Rules
                  </Button>
                </SpaceBetween>
              </Box>
              <ResourceTable
                resourceName="Status"
                headerTitle="Rule Evaluation Status"
                headerCounter={evalStatusData?.total}
                items={(evalStatusData?.statuses || []).map((s: any) => ({
                  name: s.ConfigRuleName,
                  status: s.LastStatus || "-",
                  invocationTime: s.LastSuccessfulInvocationTime
                    ? new Date(s.LastSuccessfulInvocationTime).toLocaleString()
                    : "-",
                  error: s.LastErrorMessage || "-",
                }))}
                loading={false}
                emptyMessage="No evaluation status"
                columns={[
                  { id: "name", header: "Rule Name", cell: (i: any) => i.name, isRowHeader: true },
                  {
                    id: "status",
                    header: "Last Status",
                    cell: (i: any) => (
                      <StatusIndicator type={i.status === "SUCCEEDED" ? "success" : i.status === "FAILED" ? "error" : "warning"}>
                        {i.status}
                      </StatusIndicator>
                    ),
                  },
                  { id: "invocationTime", header: "Last Invocation", cell: (i: any) => i.invocationTime },
                  { id: "error", header: "Error", cell: (i: any) => i.error },
                ]}
                filterEnabled
                filterPlaceholder="Find rules"
                filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
              />

              {/* ── Conformance Pack Status ─────────────── */}
              <ResourceTable
                resourceName="Pack Status"
                headerTitle="Conformance Pack Status"
                headerCounter={packStatusesData?.total}
                items={(packStatusesData?.statuses || []).map((s: any) => ({
                  name: s.ConformancePackName,
                  state: s.ConformancePackState || "-",
                  arn: s.ConformancePackArn || "-",
                  reason: s.ConformancePackStatusReason || "-",
                  updated: s.LastUpdateTime
                    ? new Date(s.LastUpdateTime).toLocaleString()
                    : "-",
                }))}
                loading={false}
                emptyMessage="No pack status"
                columns={[
                  { id: "name", header: "Pack Name", cell: (i: any) => i.name, isRowHeader: true },
                  {
                    id: "state",
                    header: "State",
                    cell: (i: any) => (
                      <StatusIndicator type={i.state === "CREATE_COMPLETE" ? "success" : i.state === "CREATE_FAILED" || i.state === "DELETE_FAILED" ? "error" : "in-progress"}>
                        {i.state}
                      </StatusIndicator>
                    ),
                  },
                  { id: "updated", header: "Last Updated", cell: (i: any) => i.updated },
                  { id: "reason", header: "Status Reason", cell: (i: any) => i.reason },
                ]}
                filterEnabled
                filterPlaceholder="Find packs"
                filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
              />

              {/* ── Recorder Status ─────────────────────── */}
              <ResourceTable
                resourceName="Recorder Status"
                headerTitle="Configuration Recorder Status"
                headerCounter={recorderStatusesData?.total}
                items={(recorderStatusesData?.statuses || []).map((s: any) => ({
                  name: s.name,
                  recording: s.recording ? "Yes" : "No",
                  lastStart: s.lastStartTime ? new Date(s.lastStartTime).toLocaleString() : "-",
                  lastStop: s.lastStopTime ? new Date(s.lastStopTime).toLocaleString() : "-",
                  lastStatus: s.lastStatus || "-",
                }))}
                loading={false}
                emptyMessage="No recorder status"
                columns={[
                  { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                  {
                    id: "recording",
                    header: "Recording",
                    cell: (i: any) => (
                      <StatusIndicator type={i.recording === "Yes" ? "success" : "stopped"}>
                        {i.recording}
                      </StatusIndicator>
                    ),
                  },
                  { id: "lastStatus", header: "Last Status", cell: (i: any) => i.lastStatus },
                  { id: "lastStart", header: "Last Start", cell: (i: any) => i.lastStart },
                  { id: "lastStop", header: "Last Stop", cell: (i: any) => i.lastStop },
                ]}
              />
            </SpaceBetween>
          ),
        },
      ]}
    />
    {tagsTarget && <ConfigTagsModal target={tagsTarget} onClose={() => setTagsTarget(null)} />}
    </>
  );
}

// ────────────────────────────────────────────────────────
//  AppConfig
// ────────────────────────────────────────────────────────


// ────────────────────────────────────────────────────────
//  ConfigService — Governance tab
// ────────────────────────────────────────────────────────

function GovernanceTab() {
  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h3">Aggregation Authorizations</Header>}>
        <AggregationAuthorizationsSection />
      </Container>
      <Container header={<Header variant="h3">Retention Configurations</Header>}>
        <RetentionConfigurationsSection />
      </Container>
      <Container header={<Header variant="h3">Compliance Summary</Header>}>
        <ComplianceSummarySection />
      </Container>
      <Container header={<Header variant="h3">Compliance by Resource</Header>}>
        <ComplianceByResourceSection />
      </Container>
      <Container header={<Header variant="h3">Compliance Details</Header>}>
        <ComplianceDetailsSection />
      </Container>
      <Container header={<Header variant="h3">Danger Zone</Header>}>
        <DangerZoneSection />
      </Container>
    </SpaceBetween>
  );
}

function AggregationAuthorizationsSection() {
  const { data, isLoading } = useAggregationAuthorizations();
  const putAuth = usePutAggregationAuthorization();
  const deleteAuth = useDeleteAggregationAuthorization();
  const [showAdd, setShowAdd] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("");

  const items = (data?.authorizations || []).map((a: any) => ({
    account: a.AuthorizedAccountId,
    region: a.AuthorizedAwsRegion,
    arn: a.AggregationAuthorizationArn || "-",
  }));

  const handleCreate = () => {
    putAuth.mutate(
      { authorizedAccountId: accountId, authorizedAwsRegion: region },
      {
        onSuccess: () => {
          setShowAdd(false);
          setAccountId("");
          setRegion("");
        },
      },
    );
  };

  return (
    <SpaceBetween size="m">
      {putAuth.isError && (
        <Alert type="error" dismissible>
          {(putAuth.error as Error)?.message || "Failed to create authorization"}
        </Alert>
      )}
      <ResourceTable
        resourceName="Authorization"
        headerTitle="Aggregation Authorizations"
        headerCounter={data?.total}
        items={items}
        loading={isLoading}
        emptyMessage="No aggregation authorizations"
        columns={[
          { id: "account", header: "Account ID", cell: (i: any) => i.account, isRowHeader: true },
          { id: "region", header: "Authorized Region", cell: (i: any) => i.region },
          { id: "arn", header: "ARN", cell: (i: any) => i.arn },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <DeleteButton
                itemName={`${i.account}/${i.region}`}
                resourceType="aggregation authorization"
                loading={
                  deleteAuth.isPending &&
                  deleteAuth.variables?.authorizedAccountId === i.account &&
                  deleteAuth.variables?.authorizedAwsRegion === i.region
                }
                onDelete={() =>
                  deleteAuth.mutateAsync({ authorizedAccountId: i.account, authorizedAwsRegion: i.region })
                }
              />
            ),
          },
        ]}
        onCreate={() => setShowAdd(true)}
      />
      <Modal
        visible={showAdd}
        onDismiss={() => setShowAdd(false)}
        header="Add Aggregation Authorization"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={putAuth.isPending}
                disabled={!accountId || !region}
                onClick={handleCreate}
              >
                Add authorization
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Authorized account ID">
            <Input value={accountId} onChange={({ detail }) => setAccountId(detail.value)} placeholder="123456789012" />
          </FormField>
          <FormField label="Authorized AWS Region">
            <Input value={region} onChange={({ detail }) => setRegion(detail.value)} placeholder="us-east-1" />
          </FormField>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

function RetentionConfigurationsSection() {
  const { data, isLoading } = useRetentionConfigurations();
  const putRetention = usePutRetentionConfiguration();
  const deleteRetention = useDeleteRetentionConfiguration();
  const [showAdd, setShowAdd] = useState(false);
  const [days, setDays] = useState("");

  const handleSave = () => {
    putRetention.mutate(parseInt(days, 10), {
      onSuccess: () => {
        setShowAdd(false);
        setDays("");
      },
    });
  };

  return (
    <SpaceBetween size="m">
      {putRetention.isError && (
        <Alert type="error" dismissible>
          {(putRetention.error as Error)?.message || "Failed to save retention configuration"}
        </Alert>
      )}
      <ResourceTable
        resourceName="Retention Configuration"
        headerTitle="Retention Configurations"
        headerCounter={data?.total}
        items={(data?.retentionConfigurations || []).map((r: any) => ({
          name: r.Name || "default",
          days: r.RetentionPeriodInDays,
        }))}
        loading={isLoading}
        emptyMessage="No retention configurations"
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
          { id: "days", header: "Retention Period (days)", cell: (i: any) => i.days },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <DeleteButton
                itemName={i.name}
                resourceType="retention configuration"
                loading={deleteRetention.isPending && deleteRetention.variables === i.name}
                onDelete={() => deleteRetention.mutateAsync(i.name)}
              />
            ),
          },
        ]}
        onCreate={() => setShowAdd(true)}
      />
      <Modal
        visible={showAdd}
        onDismiss={() => setShowAdd(false)}
        header="Set Retention Period"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={putRetention.isPending}
                disabled={!days}
                onClick={handleSave}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Retention period (days)" description="How long AWS Config keeps configuration history.">
            <Input value={days} onChange={({ detail }) => setDays(detail.value)} inputMode="numeric" placeholder="365" />
          </FormField>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}

function ComplianceSummarySection() {
  const { data } = useComplianceSummaryByConfigRule();
  const [resourceTypes, setResourceTypes] = useState("");
  const [rtQuery, setRtQuery] = useState<string | null>(null);
  const { data: rtData, isLoading: rtLoading } = useComplianceSummaryByResourceType(rtQuery);
  const summary = data?.complianceSummary;

  return (
    <SpaceBetween size="m">
      <Box variant="p" color="text-body-secondary">
        Aggregate compliance counts across config rules and resource types.
      </Box>
      <ColumnLayout columns={4} variant="text-grid" borders="horizontal">
        <div>
          <Box variant="awsui-key-label">Compliant Rules</Box>
          <Box>{summary?.CompliantConfigRuleCount ?? "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Non-compliant Rules</Box>
          <Box>{summary?.NonCompliantConfigRuleCount ?? "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Compliant Resources</Box>
          <Box>{summary?.CompliantResourceCount ?? "—"}</Box>
        </div>
        <div>
          <Box variant="awsui-key-label">Non-compliant Resources</Box>
          <Box>{summary?.NonCompliantResourceCount ?? "—"}</Box>
        </div>
      </ColumnLayout>
      <SpaceBetween size="s">
        <Box variant="h4">By Resource Type</Box>
        <SpaceBetween direction="horizontal" size="s">
          <Input
            value={resourceTypes}
            onChange={({ detail }) => setResourceTypes(detail.value)}
            placeholder="AWS::EC2::Instance,AWS::S3::Bucket"
          />
          <Button
            variant="normal"
            disabled={!resourceTypes}
            loading={rtLoading}
            onClick={() => setRtQuery(resourceTypes)}
          >
            Fetch summary
          </Button>
        </SpaceBetween>
        <ResourceTable
          resourceName="Summary"
          headerTitle="Compliance Summaries by Resource Type"
          headerCounter={rtData?.total}
          items={(rtData?.summaries || []).map((sm: any) => ({
            resourceType: sm.ResourceKey?.ResourceType || sm.ResourceType || "-",
            compliant: sm.ComplianceSummary?.CompliantResourceCount ?? "-",
            nonCompliant: sm.ComplianceSummary?.NonCompliantResourceCount ?? "-",
          }))}
          loading={false}
          emptyMessage="No summaries — enter resource types above and fetch"
          columns={[
            { id: "resourceType", header: "Resource Type", cell: (i: any) => i.resourceType, isRowHeader: true },
            { id: "compliant", header: "Compliant", cell: (i: any) => i.compliant },
            { id: "nonCompliant", header: "Non-compliant", cell: (i: any) => i.nonCompliant },
          ]}
        />
      </SpaceBetween>
    </SpaceBetween>
  );
}

function ComplianceByResourceSection() {
  const { data, isLoading } = useComplianceByResource();
  return (
    <ResourceTable
      resourceName="Resource"
      headerTitle="Compliance by Resource"
      headerCounter={data?.total}
      items={(data?.compliance || []).map((c: any) => ({
        resourceType: c.ResourceType || "-",
        resourceId: c.ResourceId || "-",
        compliance: c.Compliance?.ComplianceType || "-",
      }))}
      loading={isLoading}
      emptyMessage="No compliance data"
      columns={[
        { id: "resourceType", header: "Resource Type", cell: (i: any) => i.resourceType, isRowHeader: true },
        { id: "resourceId", header: "Resource ID", cell: (i: any) => i.resourceId },
        {
          id: "compliance",
          header: "Compliance",
          cell: (i: any) => (
            <StatusIndicator type={i.compliance === "COMPLIANT" ? "success" : i.compliance === "NON_COMPLIANT" ? "error" : "warning"}>
              {i.compliance}
            </StatusIndicator>
          ),
        },
      ]}
      filterEnabled
      filterPlaceholder="Find resources"
      filterFunction={(i: any, s: string) => i.resourceId.toLowerCase().includes(s.toLowerCase())}
    />
  );
}

function evaluationResultColumns() {
  return [
    {
      id: "rule",
      header: "Config Rule",
      cell: (i: any) => i.rule,
      isRowHeader: true,
    },
    {
      id: "resource",
      header: "Resource",
      cell: (i: any) => i.resource,
    },
    {
      id: "compliance",
      header: "Compliance",
      cell: (i: any) => (
        <StatusIndicator type={i.compliance === "COMPLIANT" ? "success" : i.compliance === "NON_COMPLIANT" ? "error" : "warning"}>
          {i.compliance}
        </StatusIndicator>
      ),
    },
    { id: "annotation", header: "Annotation", cell: (i: any) => i.annotation },
  ];
}

function mapEvaluationResults(results: any[]) {
  return results.map((r: any) => ({
    rule: r.EvaluationResultIdentifier?.EvaluationResultQualifier?.ConfigRuleName || "-",
    resource: `${r.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceType || "?"}/${r.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceId || "?"}`,
    compliance: r.ComplianceType || "-",
    annotation: r.Annotation || "-",
  }));
}

function ComplianceDetailsSection() {
  const [ruleName, setRuleName] = useState("");
  const [ruleQuery, setRuleQuery] = useState<string | null>(null);
  const { data: ruleData, isLoading: ruleLoading } = useComplianceDetailsByConfigRule(ruleQuery);
  const [resourceType, setResourceType] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [resourceQuery, setResourceQuery] = useState<{ type: string; id: string } | null>(null);
  const { data: resourceData, isLoading: resourceLoading } = useComplianceDetailsByResource(
    resourceQuery?.type || null,
    resourceQuery?.id || null,
  );

  return (
    <SpaceBetween size="m">
      <SpaceBetween size="s">
        <Box variant="h4">By Config Rule</Box>
        <SpaceBetween direction="horizontal" size="s">
          <Input
            value={ruleName}
            onChange={({ detail }) => setRuleName(detail.value)}
            placeholder="required-tags"
          />
          <Button
            variant="normal"
            disabled={!ruleName}
            loading={ruleLoading}
            onClick={() => setRuleQuery(ruleName)}
          >
            Fetch details
          </Button>
        </SpaceBetween>
        <ResourceTable
          resourceName="Evaluation"
          headerTitle="Evaluation Results"
          items={mapEvaluationResults(ruleData?.evaluationResults || [])}
          loading={false}
          emptyMessage="No evaluation results — enter a rule name above and fetch"
          columns={evaluationResultColumns()}
        />
      </SpaceBetween>
      <SpaceBetween size="s">
        <Box variant="h4">By Resource</Box>
        <SpaceBetween direction="horizontal" size="s">
          <Input
            value={resourceType}
            onChange={({ detail }) => setResourceType(detail.value)}
            placeholder="AWS::EC2::Instance"
          />
          <Input
            value={resourceId}
            onChange={({ detail }) => setResourceId(detail.value)}
            placeholder="i-1234567890"
          />
          <Button
            variant="normal"
            disabled={!resourceType || !resourceId}
            loading={resourceLoading}
            onClick={() => setResourceQuery({ type: resourceType, id: resourceId })}
          >
            Fetch details
          </Button>
        </SpaceBetween>
        <ResourceTable
          resourceName="Evaluation"
          headerTitle="Evaluation Results"
          items={mapEvaluationResults(resourceData?.evaluationResults || [])}
          loading={false}
          emptyMessage="No evaluation results — enter a resource type and ID above and fetch"
          columns={evaluationResultColumns()}
        />
      </SpaceBetween>
    </SpaceBetween>
  );
}

function DangerZoneSection() {
  const deleteDeliveryChannel = useDeleteDeliveryChannel();
  const deleteEvalResults = useDeleteEvaluationResults();
  const [channelName, setChannelName] = useState("");
  const [ruleName, setRuleName] = useState("");

  return (
    <SpaceBetween size="m">
      <Box variant="p" color="text-body-secondary">
        Permanently delete delivery channels or clear evaluation results.
      </Box>
      <SpaceBetween size="s">
        <SpaceBetween direction="horizontal" size="s">
          <Input
            value={channelName}
            onChange={({ detail }) => setChannelName(detail.value)}
            placeholder="Delivery channel name"
          />
          <Button
            variant="normal"
            disabled={!channelName}
            loading={deleteDeliveryChannel.isPending}
            onClick={() => deleteDeliveryChannel.mutateAsync(channelName)}
          >
            Delete delivery channel
          </Button>
        </SpaceBetween>
        {deleteDeliveryChannel.isError && (
          <Alert type="error" dismissible>
            {(deleteDeliveryChannel.error as Error)?.message || "Failed to delete delivery channel"}
          </Alert>
        )}
        <SpaceBetween direction="horizontal" size="s">
          <Input
            value={ruleName}
            onChange={({ detail }) => setRuleName(detail.value)}
            placeholder="Config rule name"
          />
          <Button
            variant="normal"
            disabled={!ruleName}
            loading={deleteEvalResults.isPending}
            onClick={() => deleteEvalResults.mutateAsync(ruleName)}
          >
            Delete evaluation results
          </Button>
        </SpaceBetween>
        {deleteEvalResults.isError && (
          <Alert type="error" dismissible>
            {(deleteEvalResults.error as Error)?.message || "Failed to delete evaluation results"}
          </Alert>
        )}
      </SpaceBetween>
    </SpaceBetween>
  );
}
