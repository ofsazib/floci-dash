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
  Table,
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
  useModifyNeptuneCluster,
  useCreateNeptuneCluster,
  useDeleteNeptuneCluster,
  useNeptuneInstances,
  useAddNeptuneClusterRole,
  useRemoveNeptuneClusterRole,
  useNeptuneGlobalClusters,
  useNeptuneResourceTags,
  useAddNeptuneResourceTags,
  useRemoveNeptuneResourceTags,
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

function NeptuneClusterRolesModal({ id, onClose }: { id: string; onClose: () => void }) {
  const addRole = useAddNeptuneClusterRole();
  const removeRole = useRemoveNeptuneClusterRole();
  const [roleArn, setRoleArn] = useState("");

  return (
    <Modal
      visible
      onDismiss={onClose}
      header={`IAM roles — ${id}`}
      footer={<Box float="right"><Button variant="link" onClick={onClose}>Close</Button></Box>}
    >
      <SpaceBetween size="m">
        <FormField label="Role ARN">
          <Input value={roleArn} onChange={({ detail }) => setRoleArn(detail.value)} placeholder="arn:aws:iam::123456789012:role/neptune-role" />
        </FormField>
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="primary"
            loading={addRole.isPending}
            disabled={!roleArn.trim()}
            onClick={() =>
              addRole.mutateAsync({ id, roleArn: roleArn.trim() }).then(() => setRoleArn(""))
            }
          >
            Add role
          </Button>
          <Button
            loading={removeRole.isPending}
            disabled={!roleArn.trim()}
            onClick={() =>
              removeRole.mutateAsync({ id, roleArn: roleArn.trim() }).then(() => setRoleArn(""))
            }
          >
            Remove role
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Modal>
  );
}

function NeptuneClusterTagsModal({ cluster, onClose }: { cluster: { id: string; arn: string }; onClose: () => void }) {
  const { data } = useNeptuneResourceTags(cluster.arn);
  const addTags = useAddNeptuneResourceTags();
  const removeTags = useRemoveNeptuneResourceTags();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const tags = data?.tags || [];

  return (
    <Modal
      visible
      onDismiss={onClose}
      header={`Tags — ${cluster.id}`}
      footer={<Box float="right"><Button variant="link" onClick={onClose}>Close</Button></Box>}
    >
      <SpaceBetween size="m">
        {tags.length > 0 ? (
          <Table
            header={<Header variant="h3" counter={`(${tags.length})`}>Tags</Header>}
            columnDefinitions={[
              { id: "key", header: "Key", cell: (t: any) => t.Key, isRowHeader: true },
              { id: "value", header: "Value", cell: (t: any) => t.Value },
              {
                id: "actions",
                header: "",
                cell: (t: any) => (
                  <DeleteButton
                    itemName={t.Key}
                    resourceType="tag"
                    loading={removeTags.isPending && removeTags.variables?.tagKeys?.[0] === t.Key}
                    onDelete={() => removeTags.mutateAsync({ resourceName: cluster.arn, tagKeys: [t.Key] })}
                  />
                ),
              },
            ]}
            items={tags}
            empty="No tags"
          />
        ) : (
          <Box color="text-body-secondary">No tags</Box>
        )}
        <SpaceBetween direction="horizontal" size="xs">
          <FormField label="Key">
            <Input value={newKey} onChange={({ detail }) => setNewKey(detail.value)} placeholder="env" />
          </FormField>
          <FormField label="Value">
            <Input value={newValue} onChange={({ detail }) => setNewValue(detail.value)} placeholder="dev" />
          </FormField>
          <Button
            variant="primary"
            loading={addTags.isPending}
            disabled={!newKey.trim()}
            onClick={() =>
              addTags
                .mutateAsync({ resourceName: cluster.arn, tags: { [newKey.trim()]: newValue.trim() } })
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

export function NeptuneDashboard() {
  const { data: clustersData, isLoading: clustersLoading } = useNeptuneClusters();
  const deleteCluster = useDeleteNeptuneCluster();
  const modifyCluster = useModifyNeptuneCluster();
  const [editCluster, setEditCluster] = useState<string | null>(null);
  const [editVersion, setEditVersion] = useState("");
  const [rolesCluster, setRolesCluster] = useState<string | null>(null);
  const [tagsCluster, setTagsCluster] = useState<{ id: string; arn: string } | null>(null);
  const { data: instancesData, isLoading: instancesLoading } = useNeptuneInstances();
  const deleteInstance = useDeleteNeptuneInstance();
  const { data: globalClustersData, isLoading: globalClustersLoading } = useNeptuneGlobalClusters();

  return (
    <>
    <Tabs
      tabs={[
        {
          id: "clusters",
          label: "Clusters",
          content: (
            <ResourceTable
              resourceName="Cluster"
              headerTitle="Neptune Clusters"
              headerCounter={clustersData?.total}
              items={(clustersData?.clusters || []).map((c: any) => ({
                id: c.DBClusterIdentifier,
                status: c.Status,
                engine: c.Engine,
                version: c.EngineVersion || "-",
                endpoint: c.Endpoint || "-",
                members: c.DBClusterMembers?.length || 0,
                arn: c.DBClusterArn || `arn:aws:neptune:us-east-1:000000000000:cluster:${c.DBClusterIdentifier}`,
              }))}
              loading={clustersLoading}
              emptyMessage="No Neptune clusters"
              columns={[
                { id: "id", header: "Cluster ID", cell: (i: any) => i.id, isRowHeader: true },
                { id: "status", header: "Status", cell: (i: any) => i.status },
                { id: "engine", header: "Engine", cell: (i: any) => i.engine },
                { id: "version", header: "Version", cell: (i: any) => i.version },
                { id: "endpoint", header: "Endpoint", cell: (i: any) => i.endpoint },
                { id: "members", header: "Members", cell: (i: any) => i.members },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        onClick={() => {
                          setEditCluster(i.id);
                          setEditVersion("");
                        }}
                      >
                        Modify
                      </Button>
                      <Button onClick={() => setRolesCluster(i.id)}>Roles</Button>
                      <Button onClick={() => setTagsCluster({ id: i.id, arn: i.arn })}>Tags</Button>
                      <DeleteButton
                        itemName={i.id}
                        resourceType="cluster"
                        loading={deleteCluster.isPending && deleteCluster.variables === i.id}
                        onDelete={() => deleteCluster.mutateAsync(i.id)}
                      />
                    </SpaceBetween>
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find clusters"
              filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "instances",
          label: "Instances",
          content: (
            <ResourceTable
              resourceName="Instance"
              headerTitle="Neptune Instances"
              headerCounter={instancesData?.total}
              items={(instancesData?.instances || []).map((i: any) => ({
                id: i.DBInstanceIdentifier,
                cluster: i.DBClusterIdentifier || "-",
                cls: i.DBInstanceClass || "-",
                status: i.DBInstanceStatus || "-",
                endpoint: i.Endpoint?.Address || "-",
              }))}
              loading={instancesLoading}
              emptyMessage="No Neptune instances"
              columns={[
                { id: "id", header: "Instance ID", cell: (i: any) => i.id, isRowHeader: true },
                { id: "cluster", header: "Cluster", cell: (i: any) => i.cluster },
                { id: "cls", header: "Class", cell: (i: any) => i.cls },
                { id: "status", header: "Status", cell: (i: any) => i.status },
                { id: "endpoint", header: "Endpoint", cell: (i: any) => i.endpoint },
                {
                  id: "actions",
                  header: "",
                  cell: (i: any) => (
                    <DeleteButton
                      itemName={i.id}
                      resourceType="instance"
                      loading={deleteInstance.isPending && deleteInstance.variables === i.id}
                      onDelete={() => deleteInstance.mutateAsync(i.id)}
                    />
                  ),
                },
              ]}
              filterEnabled
              filterPlaceholder="Find instances"
              filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
        {
          id: "global-clusters",
          label: `Global Clusters (${globalClustersData?.total ?? 0})`,
          content: (
            <ResourceTable
              resourceName="Global cluster"
              headerTitle="Neptune Global Clusters"
              headerCounter={globalClustersData?.total}
              items={(globalClustersData?.globalClusters || []).map((g: any) => ({
                id: g.GlobalClusterIdentifier,
                arn: g.GlobalClusterArn || "-",
                engine: g.Engine || "-",
                version: g.EngineVersion || "-",
                status: g.Status || "-",
                members: g.GlobalClusterMembers?.length || 0,
              }))}
              loading={globalClustersLoading}
              emptyMessage="No Neptune global clusters"
              columns={[
                { id: "id", header: "Global Cluster ID", cell: (i: any) => i.id, isRowHeader: true },
                { id: "engine", header: "Engine", cell: (i: any) => i.engine },
                { id: "version", header: "Version", cell: (i: any) => i.version },
                { id: "status", header: "Status", cell: (i: any) => i.status },
                { id: "members", header: "Members", cell: (i: any) => i.members },
              ]}
              filterEnabled
              filterPlaceholder="Find global clusters"
              filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
            />
          ),
        },
      ]}
    />
    {rolesCluster && (
      <NeptuneClusterRolesModal id={rolesCluster} onClose={() => setRolesCluster(null)} />
    )}
    {tagsCluster && (
      <NeptuneClusterTagsModal cluster={tagsCluster} onClose={() => setTagsCluster(null)} />
    )}
    {editCluster && (
        <Modal
          visible
          onDismiss={() => setEditCluster(null)}
          header={`Modify cluster — ${editCluster}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setEditCluster(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={modifyCluster.isPending}
                  onClick={() => {
                    modifyCluster.mutate(
                      { id: editCluster, engineVersion: editVersion.trim() || undefined },
                      { onSuccess: () => setEditCluster(null) }
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
            {modifyCluster.isError && (
              <Alert type="error" dismissible>
                {(modifyCluster.error as Error)?.message || "Failed to modify cluster"}
              </Alert>
            )}
            <FormField label="Engine version">
              <Input value={editVersion} onChange={({ detail }) => setEditVersion(detail.value)} placeholder="1.3.0" />
            </FormField>
          </Form>
        </Modal>
      )}
    </>
  );
}
