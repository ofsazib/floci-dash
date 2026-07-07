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

export function EKSDashboard() {
  const { data: clustersData, isLoading: clustersLoading } = useEKSClusters();
  const createCluster = useEKSCreateCluster();
  const deleteCluster = useEKSDeleteCluster();
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [clusterName, setClusterName] = useState("");
  const [clusterRoleArn, setClusterRoleArn] = useState("");
  const [clusterVersion, setClusterVersion] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const { data: nodegroupsData, isLoading: nodegroupsLoading } = useEKSNodegroups(selectedCluster);
  const createNodegroup = useEKSCreateNodegroup(selectedCluster || "");
  const deleteNodegroup = useEKSDeleteNodegroup(selectedCluster || "");
  const [showCreateNodegroup, setShowCreateNodegroup] = useState(false);
  const [ngName, setNgName] = useState("");
  const [ngNodeRole, setNgNodeRole] = useState("");
  const [ngSubnets, setNgSubnets] = useState("");

  if (clustersLoading) return <TableSkeleton />;

  if (selectedCluster) {
    return (
      <SpaceBetween size="l">
        <Box>
          <Button iconName="arrow-left" onClick={() => setSelectedCluster(null)}>
            Back to clusters
          </Button>
        </Box>
        <NodegroupsPanel
          clusterName={selectedCluster}
          nodegroupsData={nodegroupsData}
          nodegroupsLoading={nodegroupsLoading}
          createNodegroup={createNodegroup}
          deleteNodegroup={deleteNodegroup}
          showCreateNodegroup={showCreateNodegroup}
          setShowCreateNodegroup={setShowCreateNodegroup}
          ngName={ngName}
          setNgName={setNgName}
          ngNodeRole={ngNodeRole}
          setNgNodeRole={setNgNodeRole}
          ngSubnets={ngSubnets}
          setNgSubnets={setNgSubnets}
        />
      </SpaceBetween>
    );
  }

  return (
    <>
      <ResourceTable
        resourceName="Cluster"
        headerTitle="EKS Clusters"
        headerCounter={clustersData?.total}
        items={(clustersData?.clusters || []).map((c: any) => ({
          name: c.name,
          status: c.status,
          version: c.version || "-",
          endpoint: c.endpoint || "-",
          created: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-",
        }))}
        loading={clustersLoading}
        onCreate={() => setShowCreateCluster(true)}
        emptyMessage="No EKS clusters"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => setSelectedCluster(item.name)}
              >
                {item.name}
              </Button>
            ),
            isRowHeader: true,
          },
          { id: "status", header: "Status", cell: (item: any) => item.status },
          { id: "version", header: "Version", cell: (item: any) => item.version },
          { id: "created", header: "Created", cell: (item: any) => item.created },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="cluster"
                loading={deleteCluster.isPending && deleteCluster.variables === item.name}
                onDelete={() => deleteCluster.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find clusters by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      <Modal
        visible={showCreateCluster}
        onDismiss={() => setShowCreateCluster(false)}
        header="Create EKS cluster"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateCluster(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  createCluster.mutate(
                    {
                      name: clusterName,
                      roleArn: clusterRoleArn,
                      version: clusterVersion || undefined,
                    },
                    {
                      onSuccess: () => {
                        setShowCreateCluster(false);
                        setClusterName("");
                        setClusterRoleArn("");
                        setClusterVersion("");
                      },
                    }
                  );
                }}
                disabled={!clusterName || !clusterRoleArn}
                loading={createCluster.isPending}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Cluster name">
            <Input
              value={clusterName}
              onChange={({ detail }) => setClusterName(detail.value)}
              placeholder="my-cluster"
            />
          </FormField>
          <FormField label="Role ARN">
            <Input
              value={clusterRoleArn}
              onChange={({ detail }) => setClusterRoleArn(detail.value)}
              placeholder="arn:aws:iam::123456789012:role/eks-role"
            />
          </FormField>
          <FormField label="Kubernetes version (optional)">
            <Input
              value={clusterVersion}
              onChange={({ detail }) => setClusterVersion(detail.value)}
              placeholder="1.27"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}


export function NodegroupsPanel({
  clusterName,
  nodegroupsData,
  nodegroupsLoading,
  createNodegroup,
  deleteNodegroup,
  showCreateNodegroup,
  setShowCreateNodegroup,
  ngName,
  setNgName,
  ngNodeRole,
  setNgNodeRole,
  ngSubnets,
  setNgSubnets,
}: {
  clusterName: string;
  nodegroupsData: any;
  nodegroupsLoading: boolean;
  createNodegroup: any;
  deleteNodegroup: any;
  showCreateNodegroup: boolean;
  setShowCreateNodegroup: (v: boolean) => void;
  ngName: string;
  setNgName: (v: string) => void;
  ngNodeRole: string;
  setNgNodeRole: (v: string) => void;
  ngSubnets: string;
  setNgSubnets: (v: string) => void;
}) {
  return (
    <>
      <ResourceTable
        resourceName="Node Group"
        headerTitle={`Node Groups — ${clusterName}`}
        headerCounter={nodegroupsData?.total}
        items={(nodegroupsData?.nodegroups || []).map((ng: any) => ({
          name: ng.nodegroupName,
          status: ng.status,
          version: ng.version || "-",
          instanceTypes: (ng.instanceTypes || []).join(", ") || "-",
          desired: ng.scalingConfig?.desiredSize ?? "-",
          created: ng.createdAt ? new Date(ng.createdAt).toLocaleDateString() : "-",
        }))}
        loading={nodegroupsLoading}
        onCreate={() => setShowCreateNodegroup(true)}
        emptyMessage="No node groups"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => item.name,
            isRowHeader: true,
          },
          { id: "status", header: "Status", cell: (item: any) => item.status },
          { id: "version", header: "Version", cell: (item: any) => item.version },
          { id: "instanceTypes", header: "Instance Types", cell: (item: any) => item.instanceTypes },
          { id: "desired", header: "Desired", cell: (item: any) => item.desired },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="node group"
                loading={deleteNodegroup.isPending && deleteNodegroup.variables === item.name}
                onDelete={() => deleteNodegroup.mutateAsync(item.name)}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find node groups by name"
        filterFunction={(item: any, searchText: string) =>
          item.name.toLowerCase().includes(searchText.toLowerCase())
        }
      />
      <Modal
        visible={showCreateNodegroup}
        onDismiss={() => setShowCreateNodegroup(false)}
        header="Create node group"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreateNodegroup(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  createNodegroup.mutate(
                    {
                      nodegroupName: ngName,
                      nodeRole: ngNodeRole,
                      subnets: ngSubnets.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                    {
                      onSuccess: () => {
                        setShowCreateNodegroup(false);
                        setNgName("");
                        setNgNodeRole("");
                        setNgSubnets("");
                      },
                    }
                  );
                }}
                disabled={!ngName || !ngNodeRole || !ngSubnets}
                loading={createNodegroup.isPending}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          <FormField label="Node group name">
            <Input
              value={ngName}
              onChange={({ detail }) => setNgName(detail.value)}
              placeholder="my-nodegroup"
            />
          </FormField>
          <FormField label="Node role ARN">
            <Input
              value={ngNodeRole}
              onChange={({ detail }) => setNgNodeRole(detail.value)}
              placeholder="arn:aws:iam::123456789012:role/eks-node-role"
            />
          </FormField>
          <FormField label="Subnets (comma-separated)">
            <Input
              value={ngSubnets}
              onChange={({ detail }) => setNgSubnets(detail.value)}
              placeholder="subnet-12345678, subnet-87654321"
            />
          </FormField>
        </Form>
      </Modal>
    </>
  );
}

// ────────────────────────────────────────────────────────
//  Auto Scaling
// ────────────────────────────────────────────────────────

