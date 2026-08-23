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
  Toggle,
  type SelectProps,
  type TabsProps,
} from "@cloudscape-design/components";
import StatCard from "../../components/StatCard";
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
  useSESDeleteIdentity,
  useSESSendEmail,
  useSESVerifiedEmails,
  useSESVerifyEmailAddress,
  useSESDeleteVerifiedEmail,
  useSESSendingEnabled,
  useSESSetSendingEnabled,
  useSESSendQuota,
  useSESSendStatistics,
  useSESSendRawEmail,
  useSESNotificationAttributes,
  useSESSetNotificationTopic,
  useSESSetFeedbackForwarding,
  useSESSetHeadersInNotifications,
  useSESSetDkimEnabled,
  useSESSetMailFromDomain,
  useConfigurationSets,
  useCreateConfigurationSet,
  useDeleteConfigurationSet,
  useDescribeConfigurationSet,
  useCreateEventDestination,
  useUpdateEventDestination,
  useDeleteEventDestination,
  useSetConfigSendingEnabled,
  useCreateTrackingOptions,
  useUpdateTrackingOptions,
  useDeleteTrackingOptions,
  useSetReputationMetrics,
  useSetDeliveryOptions,
  useSESTemplates,
  useCreateSESTemplate,
  useDeleteSESTemplate,
  useRenderSESTemplate,
  useSESSendTemplated,
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

export function SESDashboard() {
  const { data, isLoading } = useSESIdentities();
  const verifyEmail = useSESVerifyEmail();
  const deleteIdentity = useSESDeleteIdentity();
  const sendEmail = useSESSendEmail();
  const { data: verifiedEmails } = useSESVerifiedEmails();
  const verifyEmailAddress = useSESVerifyEmailAddress();
  const deleteVerifiedEmail = useSESDeleteVerifiedEmail();
  const { data: sendingEnabled } = useSESSendingEnabled();
  const accountSetSendingEnabled = useSESSetSendingEnabled();
  const { data: sendQuota } = useSESSendQuota();
  const { data: sendStats } = useSESSendStatistics();
  const sendRawEmail = useSESSendRawEmail();
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [showVerifyEmailAddress, setShowVerifyEmailAddress] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [showSendRaw, setShowSendRaw] = useState(false);
  const [rawAddress, setRawAddress] = useState("");
  const [rawMessage, setRawMessage] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const { data: templatesData } = useSESTemplates();
  const createTemplate = useCreateSESTemplate();
  const deleteTemplate = useDeleteSESTemplate();
  const renderTemplate = useRenderSESTemplate();
  const sendTemplated = useSESSendTemplated();
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplText, setTplText] = useState("");
  const [tplHtml, setTplHtml] = useState("");
  const [rendered, setRendered] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showSendTemplated, setShowSendTemplated] = useState(false);
  const [stFrom, setStFrom] = useState("");
  const [stTo, setStTo] = useState("");
  const [stTemplate, setStTemplate] = useState("");
  const [stData, setStData] = useState("{}");
  const [rawError, setRawError] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [sendFrom, setSendFrom] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [showNotificationTopic, setShowNotificationTopic] = useState(false);
  const [notifType, setNotifType] = useState("Bounce");
  const [snsTopic, setSnsTopic] = useState("");
  const notifQuery = useSESNotificationAttributes(selectedIdentity);
  const setNotificationTopic = useSESSetNotificationTopic();
  const setFeedbackForwarding = useSESSetFeedbackForwarding();
  const setHeadersInNotifications = useSESSetHeadersInNotifications();
  const setDkimEnabled = useSESSetDkimEnabled();
  const setMailFromDomain = useSESSetMailFromDomain();
  const [showMailFrom, setShowMailFrom] = useState(false);
  const [mailFromInput, setMailFromInput] = useState("");
  const selectedIdentityData = data?.identities?.find((i: any) => i.identity === selectedIdentity);

  // ── Configuration Sets ──
  const configSetsQuery = useConfigurationSets();
  const createConfigSet = useCreateConfigurationSet();
  const deleteConfigSet = useDeleteConfigurationSet();
  const [showCreateConfigSet, setShowCreateConfigSet] = useState(false);
  const [configSetName, setConfigSetName] = useState("");
  const [selectedConfigSet, setSelectedConfigSet] = useState<string | null>(null);
  const configSetDetail = useDescribeConfigurationSet(selectedConfigSet);
  const createEventDest = useCreateEventDestination();
  const updateEventDest = useUpdateEventDestination();
  const deleteEventDest = useDeleteEventDestination();
  const setSendingEnabled = useSetConfigSendingEnabled();
  const createTrackingOpts = useCreateTrackingOptions();
  const updateTrackingOpts = useUpdateTrackingOptions();
  const deleteTrackingOpts = useDeleteTrackingOptions();
  const setRepMetrics = useSetReputationMetrics();
  const setDeliveryOpts = useSetDeliveryOptions();
  const [showCreateEventDest, setShowCreateEventDest] = useState(false);
  const [showEditEventDest, setShowEditEventDest] = useState(false);
  const [editingEventDestName, setEditingEventDestName] = useState("");
  const [showTrackingOpts, setShowTrackingOpts] = useState(false);
  const [showDeliveryOpts, setShowDeliveryOpts] = useState(false);
  const [eventDestName, setEventDestName] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [snsTopicARN, setSnsTopicARN] = useState("");
  const [trackingDomain, setTrackingDomain] = useState("");
  const [tlsPolicy, setTlsPolicy] = useState("");

  if (isLoading) return <TableSkeleton />;

  return (
    <>
      <ResourceTable
        resourceName="Email Identity"
        headerTitle="Email Identities"
        headerCounter={data?.total}
        items={(data?.identities || []).map((id: any) => ({
          identity: id.identity,
          status: id.verificationStatus || "Pending",
          dkim: id.dkimEnabled ? "Enabled" : "Disabled",
          mailFrom: id.mailFromDomain || "-",
        }))}
        loading={isLoading}
        onCreate={() => setShowVerifyEmail(true)}
        emptyMessage="No email identities"
        columns={[
          {
            id: "identity",
            header: "Identity",
            cell: (item: any) => item.identity,
            isRowHeader: true,
          },
          { id: "status", header: "Status", cell: (item: any) => item.status },
          { id: "dkim", header: "DKIM", cell: (item: any) => item.dkim },
          { id: "mailFrom", header: "Mail From", cell: (item: any) => item.mailFrom },
          {
            id: "notifications",
            header: "",
            cell: (item: any) => (
              <Button variant="link" onClick={() => setSelectedIdentity(item.identity)}>
                Notifications
              </Button>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.identity}
                resourceType="identity"
                loading={deleteIdentity.isPending && deleteIdentity.variables === item.identity}
                onDelete={() => deleteIdentity.mutateAsync(item.identity)}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find identities"
        filterFunction={(item: any, searchText: string) =>
          item.identity.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      {verifiedEmails && verifiedEmails.emails.length > 0 && (
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setShowSendEmail(true)}>Send email</Button>}
            >
              Verified Emails
            </Header>
          }
        >
          <SpaceBetween direction="vertical" size="xs">
            {verifiedEmails.emails.map((email: string) => (
              <SpaceBetween key={email} direction="horizontal" size="xs">
                <span>{email}</span>
                <DeleteButton
                  itemName={email}
                  resourceType="verified email"
                  onDelete={() => deleteVerifiedEmail.mutate(email)}
                  loading={deleteVerifiedEmail.isPending}
                />
              </SpaceBetween>
            ))}
          </SpaceBetween>
        </Container>
      )}

      <Container
        header={
          <Header
            variant="h2"
            counter={templatesData?.total}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setShowSendTemplated(true)}>Send templated</Button>
                <Button variant="primary" onClick={() => setShowCreateTemplate(true)}>Create template</Button>
              </SpaceBetween>
            }
          >
            Email Templates
          </Header>
        }
      >
        {renderError && (
          <Alert type="error" dismissible onDismiss={() => setRenderError(null)}>{renderError}</Alert>
        )}
        <ResourceTable
          resourceName="Template"
          items={(templatesData?.templates || []).map((t) => ({
            name: t.name,
            created: t.createdTimestamp ? new Date(t.createdTimestamp).toLocaleDateString() : "-",
          }))}
          columns={[
            { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
            { id: "created", header: "Created", cell: (i: any) => i.created },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    loading={renderTemplate.isPending && renderTemplate.variables?.name === i.name}
                    onClick={() =>
                      renderTemplate.mutate(
                        { name: i.name },
                        {
                          onSuccess: (data: any) => setRendered(data.rendered),
                          onError: (e) => setRenderError((e as Error).message || "Render failed"),
                        }
                      )
                    }
                  >
                    Preview
                  </Button>
                  <DeleteButton
                    itemName={i.name}
                    resourceType="template"
                    loading={deleteTemplate.isPending && deleteTemplate.variables === i.name}
                    onDelete={() => deleteTemplate.mutateAsync(i.name)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          emptyMessage="No email templates"
        />
        {rendered && (
          <pre className="fd-code-bg" style={{ fontSize: 12, padding: 12, borderRadius: 4, overflow: "auto", maxHeight: 220 }}>{rendered}</pre>
        )}
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setShowSendRaw(true)}>Send raw email</Button>
                <Button onClick={() => setShowVerifyEmailAddress(true)}>Verify address</Button>
              </SpaceBetween>
            }
          >
            Account
          </Header>
        }
      >
        <SpaceBetween size="l">
          {accountError && (
            <Alert type="error" dismissible onDismiss={() => setAccountError(null)}>
              {accountError}
            </Alert>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Toggle
              checked={sendingEnabled?.enabled ?? false}
              onChange={({ detail }) =>
                accountSetSendingEnabled.mutate(detail.checked, {
                  onError: (e) => setAccountError((e as Error)?.message || "Failed to update sending"),
                })
              }
            >
              Account sending enabled
            </Toggle>
          </div>
          <ColumnLayout columns={3}>
            <StatCard label="Max 24h send" value={sendQuota?.max24HourSend != null ? String(sendQuota.max24HourSend) : "—"} />
            <StatCard label="Max send rate" value={sendQuota?.maxSendRate != null ? String(sendQuota.maxSendRate) : "—"} />
            <StatCard label="Sent last 24h" value={sendQuota?.sentLast24Hours != null ? String(sendQuota.sentLast24Hours) : "—"} />
          </ColumnLayout>
          {(sendStats?.sendDataPoints || []).length > 0 && (
            <ResourceTable
              resourceName="Data point"
              headerTitle="Send statistics"
              items={sendStats!.sendDataPoints.map((p: any) => ({
                timestamp: p.timestamp ? new Date(p.timestamp).toLocaleString() : "—",
                deliveryAttempts: p.deliveryAttempts ?? 0,
                rejects: p.rejects ?? 0,
                complaints: p.complaints ?? 0,
                bounces: p.bounces ?? 0,
              }))}
              columns={[
                { id: "timestamp", header: "Timestamp", cell: (i: any) => i.timestamp },
                { id: "deliveryAttempts", header: "Delivery attempts", cell: (i: any) => i.deliveryAttempts },
                { id: "rejects", header: "Rejects", cell: (i: any) => i.rejects },
                { id: "complaints", header: "Complaints", cell: (i: any) => i.complaints },
                { id: "bounces", header: "Bounces", cell: (i: any) => i.bounces },
              ]}
            />
          )}
        </SpaceBetween>
      </Container>

      {/* ── Identity Notification Detail ── */}
      {selectedIdentity && (
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button variant="link" onClick={() => setSelectedIdentity(null)}>Close</Button>}
            >
              Identity Details: {selectedIdentity}
            </Header>
          }
        >
          {notifQuery.isLoading ? (
            <Spinner />
          ) : notifQuery.data ? (
            <SpaceBetween size="l">
              {/* Notification Topics */}
              <Box>
                <Header variant="h3">Notification Topics</Header>
                <SpaceBetween size="s" direction="horizontal">
                  {(["Bounce", "Complaint", "Delivery"] as const).map((type) => {
                    const key = type.toLowerCase() + "Topic" as keyof typeof notifQuery.data;
                    const topic = notifQuery.data[key];
                    return (
                      <Box key={type}>
                        <Box variant="awsui-key-label">{type}</Box>
                        <Box variant="small" color={topic ? "text-status-success" : "text-status-inactive"}>
                          {topic ? topic.TopicArn || "(set)" : "Not configured"}
                        </Box>
                        <Button
                          variant="link"
                          onClick={() => {
                            setNotifType(type);
                            setSnsTopic(topic?.TopicArn || "");
                            setShowNotificationTopic(true);
                          }}
                        >
                          {topic ? "Edit" : "Set"}
                        </Button>
                      </Box>
                    );
                  })}
                </SpaceBetween>
              </Box>

              {/* Feedback Forwarding */}
              <Box>
                <Header variant="h3">Feedback Forwarding</Header>
                <SpaceBetween direction="horizontal" size="xs">
                  <StatusIndicator type={notifQuery.data.forwardingEnabled ? "success" : "stopped"}>
                    {notifQuery.data.forwardingEnabled ? "Enabled" : "Disabled"}
                  </StatusIndicator>
                  <Button
                    variant="link"
                    onClick={() =>
                      setFeedbackForwarding.mutate({
                        identity: selectedIdentity,
                        forwardingEnabled: !notifQuery.data.forwardingEnabled,
                      })
                    }
                  >
                    {notifQuery.data.forwardingEnabled ? "Disable" : "Enable"}
                  </Button>
                </SpaceBetween>
              </Box>

              {/* DKIM */}
              <Box>
                <Header variant="h3">DKIM Signing</Header>
                <SpaceBetween direction="horizontal" size="xs">
                  <StatusIndicator type={selectedIdentityData?.dkimEnabled ? "success" : "stopped"}>
                    {selectedIdentityData?.dkimEnabled ? "Enabled" : "Disabled"}
                  </StatusIndicator>
                  <Button
                    variant="link"
                    onClick={() =>
                      setDkimEnabled.mutate({
                        identity: selectedIdentity,
                        enabled: !selectedIdentityData?.dkimEnabled,
                      })
                    }
                  >
                    {selectedIdentityData?.dkimEnabled ? "Disable" : "Enable"}
                  </Button>
                </SpaceBetween>
              </Box>

              {/* MAIL FROM */}
              <Box>
                <Header variant="h3">MAIL FROM Domain</Header>
                <SpaceBetween direction="horizontal" size="xs">
                  <StatusIndicator type={selectedIdentityData?.mailFromDomain && selectedIdentityData.mailFromDomain !== "-" ? "success" : "stopped"}>
                    {selectedIdentityData?.mailFromDomain || "Not configured"}
                  </StatusIndicator>
                  <Button
                    variant="link"
                    onClick={() => {
                      setMailFromInput(selectedIdentityData?.mailFromDomain || "");
                      setShowMailFrom(true);
                    }}
                  >
                    {selectedIdentityData?.mailFromDomain ? "Edit" : "Set"}
                  </Button>
                </SpaceBetween>
              </Box>

              {/* Headers in Notifications */}
              <Box>
                <Header variant="h3">Headers in Notifications</Header>
                <SpaceBetween size="s" direction="horizontal">
                  {(["Bounce", "Complaint", "Delivery"] as const).map((type) => {
                    const headerKey = `headersIn${type}Notifications` as keyof typeof notifQuery.data;
                    const enabled = notifQuery.data[headerKey] as boolean | undefined;
                    return (
                      <Box key={type}>
                        <Box variant="awsui-key-label">{type}</Box>
                        <StatusIndicator type={enabled ? "success" : "stopped"}>
                          {enabled ? "Included" : "Excluded"}
                        </StatusIndicator>
                        <Button
                          variant="link"
                          onClick={() =>
                            setHeadersInNotifications.mutate({
                              identity: selectedIdentity,
                              notificationType: type,
                              enabled: !enabled,
                            })
                          }
                        >
                          {enabled ? "Exclude" : "Include"}
                        </Button>
                      </Box>
                    );
                  })}
                </SpaceBetween>
              </Box>
            </SpaceBetween>
          ) : (
            <Alert type="error">Failed to load notification attributes.</Alert>
          )}
        </Container>
      )}
      <Modal
        visible={showVerifyEmail}
        onDismiss={() => setShowVerifyEmail(false)}
        header="Verify email address"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowVerifyEmail(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  verifyEmail.mutate(emailAddress);
                  setShowVerifyEmail(false);
                  setEmailAddress("");
                }}
                disabled={!emailAddress}
                loading={verifyEmail.isPending}
              >
                Verify
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Email address">
            <Input
              value={emailAddress}
              onChange={({ detail }) => setEmailAddress(detail.value)}
              placeholder="user@example.com"
            />
          </FormField>
        </Form>
      </Modal>
      <Modal
        visible={showVerifyEmailAddress}
        onDismiss={() => setShowVerifyEmailAddress(false)}
        header="Verify address (verified-emails list)"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowVerifyEmailAddress(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  verifyEmailAddress.mutate(rawAddress.trim(), {
                    onSuccess: () => {
                      setShowVerifyEmailAddress(false);
                      setRawAddress("");
                    },
                    onError: (e) => setRawError((e as Error)?.message || "Failed to verify email"),
                  });
                }}
                disabled={!rawAddress.trim()}
                loading={verifyEmailAddress.isPending}
              >
                Verify
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {rawError && (
            <Alert type="error" dismissible onDismiss={() => setRawError(null)}>
              {rawError}
            </Alert>
          )}
          <FormField label="Email address">
            <Input
              value={rawAddress}
              onChange={({ detail }) => setRawAddress(detail.value)}
              placeholder="new@example.com"
            />
          </FormField>
        </Form>
      </Modal>
      <Modal
        visible={showSendRaw}
        onDismiss={() => setShowSendRaw(false)}
        header="Send raw email (MIME)"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowSendRaw(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  sendRawEmail.mutate(
                    { rawMessage: rawMessage.trim(), source: rawAddress.trim() || undefined },
                    {
                      onSuccess: () => {
                        setShowSendRaw(false);
                        setRawMessage("");
                        setRawAddress("");
                      },
                      onError: (e) => setRawError((e as Error)?.message || "Failed to send raw email"),
                    },
                  );
                }}
                disabled={!rawMessage.trim()}
                loading={sendRawEmail.isPending}
              >
                Send
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Raw message">
            <Textarea
              value={rawMessage}
              onChange={({ detail }) => setRawMessage(detail.value)}
              placeholder="RAW: From: sender@example.com&#10;RAW: Subject: Hello&#10;RAW: Body text"
            />
          </FormField>
          <FormField label="Source (optional)">
            <Input
              value={rawAddress}
              onChange={({ detail }) => setRawAddress(detail.value)}
              placeholder="sender@example.com"
            />
          </FormField>
        </Form>
      </Modal>
      <Modal
        visible={showSendEmail}
        onDismiss={() => setShowSendEmail(false)}
        header="Send email"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowSendEmail(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  sendEmail.mutate({
                    source: sendFrom,
                    toAddresses: sendTo.split(",").map((s) => s.trim()),
                    subject: sendSubject,
                    text: sendBody,
                  });
                  setShowSendEmail(false);
                  setSendFrom("");
                  setSendTo("");
                  setSendSubject("");
                  setSendBody("");
                }}
                disabled={!sendFrom || !sendTo || !sendSubject || !sendBody}
                loading={sendEmail.isPending}
              >
                Send
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="From (verified email)">
            <Input
              value={sendFrom}
              onChange={({ detail }) => setSendFrom(detail.value)}
              placeholder="sender@example.com"
            />
          </FormField>
          <FormField label="To (comma-separated)">
            <Input
              value={sendTo}
              onChange={({ detail }) => setSendTo(detail.value)}
              placeholder="recipient@example.com"
            />
          </FormField>
          <FormField label="Subject">
            <Input
              value={sendSubject}
              onChange={({ detail }) => setSendSubject(detail.value)}
              placeholder="Test email"
            />
          </FormField>
          <FormField label="Body (text)">
            <Textarea
              value={sendBody}
              onChange={({ detail }) => setSendBody(detail.value)}
              placeholder="Hello from SES"
            />
          </FormField>
        </Form>
      </Modal>

      {/* ── Configuration Sets ── */}
      <Container
        header={
          <Header
            variant="h2"
            counter={configSetsQuery.data?.total}
            actions={<Button onClick={() => setShowCreateConfigSet(true)}>Create config set</Button>}
          >
            Configuration Sets
          </Header>
        }
      >
        <ResourceTable
          resourceName="Configuration Set"
          items={(configSetsQuery.data?.configurationSets || []).map((cs: any) => ({
            name: cs.Name,
          }))}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
            {
              id: "view",
              header: "",
              cell: (item: any) => (
                <Button variant="link" onClick={() => setSelectedConfigSet(item.name)}>
                  View
                </Button>
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (item: any) => (
                <DeleteButton
                  itemName={item.name}
                  resourceType="configuration set"
                  loading={deleteConfigSet.isPending && deleteConfigSet.variables === item.name}
                  onDelete={() => deleteConfigSet.mutateAsync(item.name)}
                />
              ),
            },
          ]}
          loading={configSetsQuery.isLoading}
          emptyMessage="No configuration sets found"
        />

        {selectedConfigSet && (
          <Box padding={{ top: "l" }}>
            <Header
              variant="h3"
              actions={<Button variant="link" onClick={() => setSelectedConfigSet(null)}>Close</Button>}
            >
              {selectedConfigSet}
            </Header>
            {configSetDetail.isLoading ? (
              <Spinner />
            ) : configSetDetail.data ? (
              <SpaceBetween size="l">
                <Box>
                  <Header variant="h3" actions={<Button onClick={() => setShowCreateEventDest(true)}>Add destination</Button>}>
                    Event Destinations
                  </Header>
                  {(configSetDetail.data.eventDestinations || []).length === 0 ? (
                    <Box variant="small" color="text-status-inactive">No event destinations configured.</Box>
                  ) : (
            <SpaceBetween size="s">
              {configSetDetail.data.eventDestinations.map((ed: any) => (
                        <Box key={ed.Name}>
                          <Box variant="awsui-key-label">{ed.Name}</Box>
                          <Box variant="small">
                            Enabled: {ed.Enabled ? "Yes" : "No"} | Types: {(ed.MatchingEventTypes || []).join(", ")}
                          </Box>
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              variant="link"
                              onClick={() => {
                                setEditingEventDestName(ed.Name);
                                setEventDestName(ed.Name);
                                setEventTypes((ed.MatchingEventTypes || []).join(", "));
                                setSnsTopicARN(ed.SNSDestination?.TopicARN || "");
                                setShowEditEventDest(true);
                              }}
                            >
                              Edit
                            </Button>
                            <DeleteButton
                            itemName={ed.Name}
                            resourceType="event destination"
                            loading={deleteEventDest.isPending && deleteEventDest.variables?.eventDestinationName === ed.Name}                              onDelete={() =>
                              deleteEventDest.mutateAsync({ configSetName: selectedConfigSet, eventDestinationName: ed.Name })
                            }
                          />
                          </SpaceBetween>
                        </Box>
                      ))}
                    </SpaceBetween>
                  )}
                </Box>

                <Box>
                  <Header variant="h3">Sending</Header>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => setSendingEnabled.mutate({ configSetName: selectedConfigSet, enabled: true })}>
                      Enable sending
                    </Button>
                    <Button onClick={() => setSendingEnabled.mutate({ configSetName: selectedConfigSet, enabled: false })}>
                      Disable sending
                    </Button>
                  </SpaceBetween>
                </Box>

                <Box>
                  <Header variant="h3">Tracking Options</Header>
                  {configSetDetail.data.trackingOptions ? (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Box variant="small">Domain: {configSetDetail.data.trackingOptions.CustomRedirectDomain}</Box>
                      <Button variant="link" onClick={() => {
                        setTrackingDomain(configSetDetail.data.trackingOptions.CustomRedirectDomain || "");
                        setShowTrackingOpts(true);
                      }}>Edit</Button>
                      <DeleteButton
                        itemName="tracking options"
                        resourceType="tracking options"
                        loading={deleteTrackingOpts.isPending}
                        onDelete={() => deleteTrackingOpts.mutateAsync(selectedConfigSet)}
                      />
                    </SpaceBetween>
                  ) : (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Box variant="small" color="text-status-inactive">Not configured</Box>
                      <Button variant="link" onClick={() => { setTrackingDomain(""); setShowTrackingOpts(true); }}>Set</Button>
                    </SpaceBetween>
                  )}
                </Box>

                <Box>
                  <Header variant="h3">Reputation Metrics</Header>
                  <SpaceBetween direction="horizontal" size="xs">
                    <StatusIndicator type={configSetDetail.data.reputationOptions?.ReputationMetricsEnabled ? "success" : "stopped"}>
                      {configSetDetail.data.reputationOptions?.ReputationMetricsEnabled ? "Enabled" : "Disabled"}
                    </StatusIndicator>
                    <Button variant="link" onClick={() =>
                      setRepMetrics.mutate({
                        configSetName: selectedConfigSet,
                        enabled: !configSetDetail.data.reputationOptions?.ReputationMetricsEnabled,
                      })
                    }>
                      {configSetDetail.data.reputationOptions?.ReputationMetricsEnabled ? "Disable" : "Enable"}
                    </Button>
                  </SpaceBetween>
                </Box>

                <Box>
                  <Header variant="h3">Delivery Options</Header>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Box variant="small">TLS Policy: {configSetDetail.data.deliveryOptions?.TlsPolicy || "Not set"}</Box>
                    <Button variant="link" onClick={() => {
                      setTlsPolicy(configSetDetail.data.deliveryOptions?.TlsPolicy || "");
                      setShowDeliveryOpts(true);
                    }}>Edit</Button>
                  </SpaceBetween>
                </Box>
              </SpaceBetween>
            ) : (
              <Alert type="error">Failed to load configuration set details.</Alert>
            )}
          </Box>
        )}
      </Container>

      {/* ── Set Notification Topic Modal ── */}
      <Modal
        visible={showNotificationTopic}
        onDismiss={() => setShowNotificationTopic(false)}
        header={`Set ${notifType} Notification Topic`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowNotificationTopic(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setNotificationTopic.mutate(
                  {
                    identity: selectedIdentity!,
                    notificationType: notifType,
                    snsTopic: snsTopic.trim() || undefined,
                  },
                  { onSuccess: () => setShowNotificationTopic(false) }
                );
              }}
                loading={setNotificationTopic.isPending}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="SNS Topic ARN" description="Leave empty to clear the notification topic.">
            <Input
              value={snsTopic}
              onChange={({ detail }) => setSnsTopic(detail.value)}
              placeholder="arn:aws:sns:us-east-1:123456789:my-topic"
            />
          </FormField>
        </Form>
      </Modal>

      {/* ── Set Mail From Domain Modal ── */}
      <Modal
        visible={showMailFrom}
        onDismiss={() => setShowMailFrom(false)}
        header="Set MAIL FROM Domain"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowMailFrom(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setMailFromDomain.mutate(
                  { identity: selectedIdentity!, mailFromDomain: mailFromInput.trim() },
                  { onSuccess: () => setShowMailFrom(false) }
                );
              }}
                disabled={!mailFromInput.trim()}
                loading={setMailFromDomain.isPending}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="MAIL FROM Domain" description="The domain that emails appear to come from. Leave empty to clear.">
            <Input
              value={mailFromInput}
              onChange={({ detail }) => setMailFromInput(detail.value)}
              placeholder="mail.example.com"
            />
          </FormField>
        </Form>
      </Modal>

      {/* ── Create Configuration Set Modal ── */}
      <Modal
        visible={showCreateConfigSet}
        onDismiss={() => setShowCreateConfigSet(false)}
        header="Create Configuration Set"
        size="small"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateConfigSet(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                createConfigSet.mutate(configSetName.trim(), {
                  onSuccess: () => { setShowCreateConfigSet(false); setConfigSetName(""); },
                });
              }}
                disabled={!configSetName.trim()}
                loading={createConfigSet.isPending}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Configuration set name">
            <Input
              value={configSetName}
              onChange={({ detail }) => setConfigSetName(detail.value)}
              placeholder="my-config-set"
            />
          </FormField>
        </Form>
      </Modal>

      {/* ── Create Event Destination Modal ── */}
      <Modal
        visible={showCreateEventDest}
        onDismiss={() => setShowCreateEventDest(false)}
        header="Add Event Destination"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateEventDest(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                createEventDest.mutate({
                  configSetName: selectedConfigSet!,
                  eventDestinationName: eventDestName.trim(),
                  matchingEventTypes: eventTypes.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean),
                  snsTopicARN: snsTopicARN.trim() || undefined,
                }, {
                  onSuccess: () => { setShowCreateEventDest(false); setEventDestName(""); setEventTypes(""); setSnsTopicARN(""); },
                });
              }}
                disabled={!eventDestName.trim() || !eventTypes.trim()}
                loading={createEventDest.isPending}
              >
                Add
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Destination name">
            <Input value={eventDestName} onChange={({ detail }) => setEventDestName(detail.value)} placeholder="my-sns-destination" />
          </FormField>
          <FormField label="Event types" description="Comma or newline separated (e.g. send, bounce, complaint, delivery, open, click)">
            <Textarea value={eventTypes} onChange={({ detail }) => setEventTypes(detail.value)} placeholder="send, bounce" rows={2} />
          </FormField>
          <FormField label="SNS Topic ARN (optional)">
            <Input value={snsTopicARN} onChange={({ detail }) => setSnsTopicARN(detail.value)} placeholder="arn:aws:sns:us-east-1:123456789:my-topic" />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* ── Edit Event Destination Modal ── */}
      <Modal
        visible={showEditEventDest}
        onDismiss={() => setShowEditEventDest(false)}
        header={`Edit Event Destination: ${editingEventDestName}`}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowEditEventDest(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                updateEventDest.mutate({
                  configSetName: selectedConfigSet!,
                  eventDestinationName: editingEventDestName,
                  matchingEventTypes: eventTypes.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean),
                  snsTopicARN: snsTopicARN.trim() || undefined,
                }, {
                  onSuccess: () => { setShowEditEventDest(false); },
                });
              }}
                disabled={!eventDestName.trim() || !eventTypes.trim()}
                loading={updateEventDest.isPending}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Destination name">
            <Input value={eventDestName} disabled />
          </FormField>
          <FormField label="Event types" description="Comma or newline separated (e.g. send, bounce, complaint, delivery, open, click)">
            <Textarea value={eventTypes} onChange={({ detail }) => setEventTypes(detail.value)} placeholder="send, bounce" rows={2} />
          </FormField>
          <FormField label="SNS Topic ARN (optional)">
            <Input value={snsTopicARN} onChange={({ detail }) => setSnsTopicARN(detail.value)} placeholder="arn:aws:sns:us-east-1:123456789:my-topic" />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* ── Tracking Options Modal ── */}
      <Modal
        visible={showTrackingOpts}
        onDismiss={() => setShowTrackingOpts(false)}
        header="Set Tracking Options"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowTrackingOpts(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const opts = { configSetName: selectedConfigSet!, customRedirectDomain: trackingDomain.trim() };
                if (configSetDetail.data?.trackingOptions) {
                  updateTrackingOpts.mutate(opts, { onSuccess: () => setShowTrackingOpts(false) });
                } else {
                  createTrackingOpts.mutate(opts, { onSuccess: () => setShowTrackingOpts(false) });
                }
              }}
                disabled={!trackingDomain.trim()}
                loading={createTrackingOpts.isPending || updateTrackingOpts.isPending}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Custom redirect domain" description="The domain to use for click/open tracking redirects.">
            <Input
              value={trackingDomain}
              onChange={({ detail }) => setTrackingDomain(detail.value)}
              placeholder="click.example.com"
            />
          </FormField>
        </Form>
      </Modal>

      {/* ── Delivery Options Modal ── */}
      <Modal
        visible={showDeliveryOpts}
        onDismiss={() => setShowDeliveryOpts(false)}
        header="Set Delivery Options"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowDeliveryOpts(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setDeliveryOpts.mutate(
                  { configSetName: selectedConfigSet!, tlsPolicy: tlsPolicy || undefined },
                  { onSuccess: () => setShowDeliveryOpts(false) }
                );
              }}
                loading={setDeliveryOpts.isPending}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="TLS Policy" description="Require or Optional. Leave empty for default.">
            <Select
              selectedOption={tlsPolicy ? { label: tlsPolicy, value: tlsPolicy } : null}
              onChange={({ detail }) => setTlsPolicy(detail.selectedOption.value!)}
              options={[
                { label: "Require", value: "Require" },
                { label: "Optional", value: "Optional" },
              ]}
              placeholder="Select TLS policy"
            />
          </FormField>
        </Form>
      </Modal>

      <Modal
        visible={showCreateTemplate}
        onDismiss={() => setShowCreateTemplate(false)}
        header="Create email template"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateTemplate(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createTemplate.isPending}
                disabled={!tplName.trim()}
                onClick={() => {
                  createTemplate.mutate(
                    { name: tplName.trim(), subject: tplSubject, text: tplText, html: tplHtml },
                    {
                      onSuccess: () => {
                        setShowCreateTemplate(false);
                        setTplName(""); setTplSubject(""); setTplText(""); setTplHtml("");
                      },
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
          {createTemplate.isError && (
            <Alert type="error" dismissible>
              {(createTemplate.error as Error)?.message || "Failed to create template"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Template name">
              <Input value={tplName} onChange={({ detail }) => setTplName(detail.value)} placeholder="welcome" />
            </FormField>
            <FormField label="Subject">
              <Input value={tplSubject} onChange={({ detail }) => setTplSubject(detail.value)} placeholder="Hi {{name}}" />
            </FormField>
            <FormField label="Text part">
              <Textarea value={tplText} onChange={({ detail }) => setTplText(detail.value)} rows={3} />
            </FormField>
            <FormField label="HTML part">
              <Textarea value={tplHtml} onChange={({ detail }) => setTplHtml(detail.value)} rows={4} />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal
        visible={showSendTemplated}
        onDismiss={() => setShowSendTemplated(false)}
        header="Send templated email"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowSendTemplated(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={sendTemplated.isPending}
                disabled={!stFrom.trim() || !stTo.trim() || !stTemplate.trim()}
                onClick={() => {
                  sendTemplated.mutate(
                    {
                      source: stFrom.trim(),
                      template: stTemplate.trim(),
                      destination: { to: [stTo.trim()] },
                      templateData: stData,
                    },
                    { onSuccess: () => setShowSendTemplated(false) }
                  );
                }}
              >
                Send
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {sendTemplated.isError && (
            <Alert type="error" dismissible>
              {(sendTemplated.error as Error)?.message || "Failed to send templated email"}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="From">
              <Input value={stFrom} onChange={({ detail }) => setStFrom(detail.value)} placeholder="sender@example.com" />
            </FormField>
            <FormField label="To">
              <Input value={stTo} onChange={({ detail }) => setStTo(detail.value)} placeholder="recipient@example.com" />
            </FormField>
            <FormField label="Template name">
              <Input value={stTemplate} onChange={({ detail }) => setStTemplate(detail.value)} placeholder="welcome" />
            </FormField>
            <FormField label="Template data (JSON)">
              <Textarea value={stData} onChange={({ detail }) => setStData(detail.value)} rows={3} />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  STS
// ────────────────────────────────────────────────────────

