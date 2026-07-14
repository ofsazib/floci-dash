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
  useConfigRuleEvaluationStatus,
  useStartConfigRulesEvaluation,
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

  if (isLoading) return <TableSkeleton />;

  return (
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
                    <DeleteButton
                      itemName={i.name}
                      resourceType="config rule"
                      loading={deleteRule.isPending && deleteRule.variables === i.name}
                      onDelete={() => deleteRule.mutateAsync(i.name)}
                    />
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
                    <DeleteButton
                      itemName={i.name}
                      resourceType="conformance pack"
                      loading={deletePack.isPending && deletePack.variables === i.name}
                      onDelete={() => deletePack.mutateAsync(i.name)}
                    />
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
  );
}

// ────────────────────────────────────────────────────────
//  AppConfig
// ────────────────────────────────────────────────────────

